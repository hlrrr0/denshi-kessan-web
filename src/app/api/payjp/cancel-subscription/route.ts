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
        { error: "UserId is required" },
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

    // サブスクリプション情報を取得
    const subscriptionDocRef = db.collection("users").doc(userId).collection("subscription").doc("current");
    const subscriptionSnap = await subscriptionDocRef.get();

    if (!subscriptionSnap.exists) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const subscriptionData = subscriptionSnap.data();
    
    if (!subscriptionData?.payjpId || subscriptionData?.payjpType !== "subscription") {
      return NextResponse.json(
        { error: "No active subscription to cancel" },
        { status: 400 }
      );
    }

    const subscriptionId = subscriptionData.payjpId;
    
    try {
      console.log("Canceling subscription:", subscriptionId);
      
      // Pay.jp の定期課金をキャンセル
      const deletedSubscription = await payjp.subscriptions.delete(subscriptionId);
      
      console.log("Subscription deleted:", deletedSubscription);

      // Firestoreのサブスクリプション情報を更新
      // 期限まではアクティブのまま、自動更新フラグだけをfalseにする
      await subscriptionDocRef.update({
        automaticRenewalFlag: false,
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Subscription canceled successfully. Access continues until expiration date.",
      });
    } catch (error: any) {
      console.error("Subscription cancellation error:", error);
      console.error("Error status:", error.status);
      console.error("Error body:", JSON.stringify(error.body, null, 2));
      throw error;
    }
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription", details: error.message },
      { status: 500 }
    );
  }
}
