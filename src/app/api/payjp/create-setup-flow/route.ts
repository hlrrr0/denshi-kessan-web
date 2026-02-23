import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const secretKey = process.env.PAYJP_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYJP_SECRET_KEY is not configured");
    }

    // Firebase Adminを取得
    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 500 }
      );
    }

    // ユーザーの Customer ID を取得または作成
    const userDoc = await db.collection("users").doc(userId).get();
    let customerId = userDoc.data()?.payjpCustomerId;

    if (!customerId) {
      console.log("Creating new customer for setup flow...");
      const customer = await payjp.customers.create({
        description: `User ${userId}`,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
      console.log("Customer created:", customerId);

      // Firestoreに保存
      await db.collection("users").doc(userId).set(
        { payjpCustomerId: customerId },
        { merge: true }
      );
    } else {
      console.log("Using existing customer for setup flow:", customerId);
    }

    // Setup FlowをPay.jp REST APIで直接作成（customer_id を指定）
    const response = await fetch("https://api.pay.jp/v2/setup_flows", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment_method_types: ["card"],
        usage: "off_session",
        customer_id: customerId, // Customer ID を指定
        metadata: {
          user_id: userId,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Pay.jp API error:", errorData);
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const setupFlow = await response.json();

    return NextResponse.json({
      client_secret: setupFlow.client_secret,
      setup_flow_id: setupFlow.id,
    });
  } catch (error: any) {
    console.error("Setup Flow creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create setup flow" },
      { status: 500 }
    );
  }
}
