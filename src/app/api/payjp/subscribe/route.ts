import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/lib/payjp";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// Pay.jp v1 SDK を使用（定期課金対応）
const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { planId, userId } = await request.json();

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "PlanId and userId are required" },
        { status: 400 }
      );
    }

    // プラン情報を取得
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Firebase Adminを取得
    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 500 }
      );
    }

    // ユーザー情報を取得
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const customerId = userData?.payjpCustomerId;
    const cardId = userData?.payjpCardId;

    if (!customerId || !cardId) {
      return NextResponse.json(
        { error: "Card not found. Please register a card first." },
        { status: 400 }
      );
    }

    console.log("Using customer:", customerId);
    console.log("Card ID:", cardId);

    // Customerのカード情報を確認
    try {
      const customer = await payjp.customers.retrieve(customerId);
      console.log("Customer default_card:", customer.default_card);
      
      if (!customer.default_card) {
        throw new Error("Customer has no default card");
      }
    } catch (customerError: any) {
      console.error("Error checking customer:", customerError);
      return NextResponse.json(
        { error: "Customer validation failed. Please re-register your card." },
        { status: 400 }
      );
    }

    // プランに応じて処理を分岐
    let payjpId: string;
    let automaticRenewal: boolean;
    let expirationDate: Date;

    if (planId === "1year") {
      // 1年プラン: 定期課金（真の自動更新）
      try {
        console.log("Creating subscription with plan: yearly_plan_980");
        
        const subscription = await payjp.subscriptions.create({
          customer: customerId,
          plan: "yearly_plan_980",
        });

        payjpId = subscription.id;
        automaticRenewal = true;
        
        // 次回課金日を取得
        expirationDate = new Date(subscription.current_period_end * 1000);
        
        console.log("Subscription created:", payjpId);
        console.log("Next billing date:", expirationDate);
        console.log("Subscription status:", subscription.status);
      } catch (subscriptionError: any) {
        console.error("Subscription creation error:", subscriptionError);
        console.error("Error status:", subscriptionError.status);
        console.error("Error body:", JSON.stringify(subscriptionError.body, null, 2));
        throw subscriptionError;
      }
    } else {
      // 5年プラン: 単発決済（一括払い）
      try {
        console.log(`Creating one-time charge for ${plan.name}`);
        
        const charge = await payjp.charges.create({
          amount: plan.price,
          currency: "jpy",
          customer: customerId,
          description: `${plan.name} - 5 years prepaid for user ${userId}`,
        });

        payjpId = charge.id;
        automaticRenewal = false;
        
        // 有効期限を計算（60ヶ月後）
        expirationDate = new Date();
        expirationDate.setMonth(expirationDate.getMonth() + plan.periodMonths);
        
        console.log("Charge created:", payjpId);
        console.log("Charge paid:", charge.paid);
        console.log("Expiration date:", expirationDate);
      } catch (chargeError: any) {
        console.error("Charge creation error:", chargeError);
        console.error("Error status:", chargeError.status);
        console.error("Error body:", JSON.stringify(chargeError.body, null, 2));
        throw chargeError;
      }
    }

    // Firestoreにサブスクリプション情報を保存
    await db.collection("users").doc(userId).collection("subscription").doc("current").set({
      subscriptionPlanId: planId,
      payjpId: payjpId, // Subscription IDまたはCharge ID
      payjpType: planId === "1year" ? "subscription" : "charge", // 種別を保存
      active: true,
      expirationDate: admin.firestore.Timestamp.fromDate(expirationDate),
      automaticRenewalFlag: automaticRenewal,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      payjpId: payjpId,
      payjpType: planId === "1year" ? "subscription" : "charge",
      expirationDate: expirationDate.toISOString(),
      automaticRenewal: automaticRenewal,
    });
  } catch (error: any) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Subscription failed", details: error.message },
      { status: 500 }
    );
  }
}
