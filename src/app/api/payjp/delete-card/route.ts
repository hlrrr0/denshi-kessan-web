import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// Pay.jp v1 SDK
const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
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

    const data = userDoc.data();
    const customerId = data?.payjpCustomerId;
    const cardId = data?.payjpCardId;

    if (!customerId || !cardId) {
      return NextResponse.json(
        { error: "No card to delete" },
        { status: 400 }
      );
    }

    console.log("Deleting card:", cardId, "from customer:", customerId);

    try {
      // Pay.jpでカードを削除
      await payjp.customers.deleteCard(customerId, cardId);
      
      console.log("Card deleted successfully");

      // Firestoreからカード情報を削除
      await db.collection("users").doc(userId).set(
        {
          payjpCardId: admin.firestore.FieldValue.delete(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        message: "Card deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting card:", error);
      throw error;
    }
  } catch (error: any) {
    console.error("Card deletion error:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete card", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
