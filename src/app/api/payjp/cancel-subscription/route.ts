import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuthAndUserId } from "@/lib/auth-server";
import admin from "firebase-admin";

// Pay.jp v1 SDK
const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "UserId is required" },
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
      // Pay.jp の定期課金をキャンセル
      const deletedSubscription = await payjp.subscriptions.delete(subscriptionId);

      // Firestoreのサブスクリプション情報を更新
      // 期限まではアクティブのまま、自動更新フラグだけをfalseにする
      await subscriptionDocRef.update({
        automaticRenewalFlag: false,
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 🆕 ユーザーが所有する全企業のサブスクリプション状態を更新
      // キャンセルしても期限までは有効なので、subscriptionActiveはtrueのまま
      const companiesSnapshot = await db.collection("companies")
        .where("userId", "==", userId)
        .get();
      
      if (!companiesSnapshot.empty) {
        const batch = db.batch();
        const expirationDate = subscriptionData.expirationDate;
        
        companiesSnapshot.docs.forEach(companyDoc => {
          batch.update(companyDoc.ref, {
            subscriptionActive: true, // 期限までは有効
            subscriptionExpiresAt: expirationDate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        
        await batch.commit();
      }

      return NextResponse.json({
        success: true,
        message: "Subscription canceled successfully. Access continues until expiration date.",
      });
    } catch (error: any) {
      console.error("Subscription cancellation error:", error);
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
