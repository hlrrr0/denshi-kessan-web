import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuthAndUserId } from "@/lib/auth-server";
import admin from "firebase-admin";

// Pay.jp v1 SDK
const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, token } = body;

    if (!userId || !token) {
      return NextResponse.json(
        { error: "userId and token are required" },
        { status: 400 }
      );
    }

    // 認証チェック
    const authResult = await verifyAuthAndUserId(request, userId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
    let customerId = userDoc.exists ? userDoc.data()?.payjpCustomerId : null;

    if (customerId) {
      // 既存のCustomerにカードを追加（既存カードは削除）
      
      try {
        const customer = await payjp.customers.retrieve(customerId);
        
        // 既存のカードを削除
        if (customer.default_card) {
          const secretKey = process.env.PAYJP_SECRET_KEY;
          await fetch(`https://api.pay.jp/v1/customers/${customerId}/cards/${customer.default_card}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
            },
          });
        }
        
        // 新しいカードを追加（REST API）
        const secretKeyForCreate = process.env.PAYJP_SECRET_KEY;
        const createRes = await fetch(`https://api.pay.jp/v1/customers/${customerId}/cards`, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${Buffer.from(secretKeyForCreate + ":").toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `card=${token}`,
        });

        if (!createRes.ok) {
          const errBody = await createRes.json();
          throw new Error(errBody.error?.message || "Failed to create card");
        }

        const card = await createRes.json();
        
        // Firestoreにカード情報を保存
        await db.collection("users").doc(userId).set(
          {
            payjpCardId: card.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return NextResponse.json({
          success: true,
          customerId: customerId,
          cardId: card.id,
        });
      } catch (error: any) {
        console.error("Error updating customer card:", error);
        throw error;
      }
    } else {
      // 新規Customerを作成してカードを登録
      
      try {
        const customer = await payjp.customers.create({
          card: token,
          description: `User ${userId}`,
          metadata: { user_id: userId },
        });
        
        // Firestoreにカスタマー情報を保存
        await db.collection("users").doc(userId).set(
          {
            payjpCustomerId: customer.id,
            payjpCardId: customer.default_card,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        return NextResponse.json({
          success: true,
          customerId: customer.id,
          cardId: customer.default_card,
        });
      } catch (error: any) {
        console.error("Error creating customer:", error);
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Card registration error:", error);
    return NextResponse.json(
      { 
        error: "Failed to register card", 
        details: error.message,
        payjpError: error.body 
      },
      { status: 500 }
    );
  }
}
