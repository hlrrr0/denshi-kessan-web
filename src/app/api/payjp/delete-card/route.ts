import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuthAndUserId } from "@/lib/auth-server";
import admin from "firebase-admin";

// Pay.jp v1 SDK
function getPayjp() {
  return require("payjp")(process.env.PAYJP_SECRET_KEY);
}

export async function POST(request: Request) {
  try {
    const payjp = getPayjp();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
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
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const data = userDoc.data();
    const customerId = data?.payjpCustomerId;
    let cardId = data?.payjpCardId;

    if (!customerId) {
      return NextResponse.json(
        { error: "No card to delete" },
        { status: 400 }
      );
    }

    // cardIdがFirestoreにない場合、Pay.jpから取得
    if (!cardId) {
      try {
        const customer = await payjp.customers.retrieve(customerId);
        cardId = customer.default_card;
        if (!cardId) {
          return NextResponse.json(
            { error: "No card to delete" },
            { status: 400 }
          );
        }
      } catch (e: any) {
        console.error("Error retrieving customer:", e);
        return NextResponse.json(
          { error: "No card to delete" },
          { status: 400 }
        );
      }
    }

    try {
      // Pay.jp REST APIで直接カードを削除
      const secretKey = process.env.PAYJP_SECRET_KEY;
      const res = await fetch(`https://api.pay.jp/v1/customers/${customerId}/cards/${cardId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
        },
      });

      if (!res.ok) {
        const errBody = await res.json();
        throw new Error(errBody.error?.message || "Failed to delete card");
      }

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
