import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// Pay.jp v1 SDK
const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { userId, token } = await request.json();

    if (!userId || !token) {
      return NextResponse.json(
        { error: "userId and token are required" },
        { status: 400 }
      );
    }

    console.log("Registering card with token for user:", userId);

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
      console.log("Updating card for existing customer:", customerId);
      
      try {
        const customer = await payjp.customers.retrieve(customerId);
        
        // 既存のカードを削除
        if (customer.default_card) {
          console.log("Deleting old card:", customer.default_card);
          await payjp.customers.deleteCard(customerId, customer.default_card);
        }
        
        // 新しいカードを追加
        const card = await payjp.customers.createCard(customerId, {
          card: token,
        });
        
        console.log("New card added:", card.id);
        
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
      console.log("Creating new customer with card");
      
      try {
        const customer = await payjp.customers.create({
          card: token,
          description: `User ${userId}`,
          metadata: { user_id: userId },
        });
        
        console.log("Customer created:", customer.id);
        console.log("Default card:", customer.default_card);
        
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
    console.error("Error status:", error.status);
    console.error("Error body:", JSON.stringify(error.body, null, 2));
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
