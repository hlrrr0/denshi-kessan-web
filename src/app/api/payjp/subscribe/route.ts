import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/lib/payjp";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuthAndUserId } from "@/lib/auth-server";
import admin from "firebase-admin";

// Pay.jp v1 SDK を使用（定期課金対応）
function getPayjp() {
  return require("payjp")(process.env.PAYJP_SECRET_KEY);
}

export async function POST(request: Request) {
  try {
    const payjp = getPayjp();
    const body = await request.json();
    const { planId, userId } = body;

    if (!planId || !userId) {
      return NextResponse.json(
        { error: "PlanId and userId are required" },
        { status: 400 }
      );
    }

    // 認証チェック
    const authResult = await verifyAuthAndUserId(request, userId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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

    // 既存のサブスクリプション情報を取得（プラン変更時の期限延長用）
    const existingSubDoc = await db.collection("users").doc(userId).collection("subscription").doc("current").get();
    const existingSub = existingSubDoc.exists ? existingSubDoc.data() : null;
    let currentExpirationDate: Date | null = null;
    
    if (existingSub && existingSub.active) {
      const expDate = existingSub.expirationDate?.toDate();
      if (expDate && expDate > new Date()) {
        currentExpirationDate = expDate;
      }

      // 既存が定期課金(subscription)の場合、Pay.jpの定期課金を停止
      if (existingSub.payjpType === "subscription" && existingSub.payjpId) {
        try {
          await payjp.subscriptions.cancel(existingSub.payjpId);
        } catch (cancelError: any) {
          // 既にキャンセル済みなどのエラーは無視
        }
      }
    }

    // Customerのカード情報を確認
    try {
      const customer = await payjp.customers.retrieve(customerId);
      
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

    if (planId === "1year" || planId === "1year_legacy") {
      // 1年プラン: 定期課金（真の自動更新）
      const payjpPlanId = plan.payjpPlanId;
      if (!payjpPlanId) {
        return NextResponse.json({ error: "Plan configuration error" }, { status: 500 });
      }
      try {
        const subscription = await payjp.subscriptions.create({
          customer: customerId,
          plan: payjpPlanId,
        });

        payjpId = subscription.id;
        automaticRenewal = true;
        
        // 既存の有効期限がある場合はそこに+12ヶ月、なければPay.jpの次回課金日を使用
        if (currentExpirationDate) {
          expirationDate = new Date(currentExpirationDate);
          expirationDate.setMonth(expirationDate.getMonth() + plan.periodMonths);
        } else {
          expirationDate = new Date(subscription.current_period_end * 1000);
        }
        
      } catch (subscriptionError: any) {
        console.error("Subscription creation error:", subscriptionError);
        throw subscriptionError;
      }
    } else {
      // 5年・10年プラン: 単発決済（一括払い）
      try {
        const charge = await payjp.charges.create({
          amount: plan.price,
          currency: "jpy",
          customer: customerId,
          description: `${plan.name} - ${plan.periodMonths / 12} years prepaid for user ${userId}`,
        });

        payjpId = charge.id;
        automaticRenewal = false;
        
        // 既存の有効期限がある場合はそこに加算、なければ現在日時から計算
        if (currentExpirationDate) {
          expirationDate = new Date(currentExpirationDate);
        } else {
          expirationDate = new Date();
        }
        expirationDate.setMonth(expirationDate.getMonth() + plan.periodMonths);
        
      } catch (chargeError: any) {
        console.error("Charge creation error:", chargeError);
        throw chargeError;
      }
    }

    // Firestoreにサブスクリプション情報を保存
    await db.collection("users").doc(userId).collection("subscription").doc("current").set({
      subscriptionPlanId: planId,
      payjpId: payjpId, // Subscription IDまたはCharge ID
      payjpType: (planId === "1year" || planId === "1year_legacy") ? "subscription" : "charge", // 種別を保存
      active: true,
      expirationDate: admin.firestore.Timestamp.fromDate(expirationDate),
      automaticRenewalFlag: automaticRenewal,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🆕 ユーザーが所有する全企業のサブスクリプション状態を更新
    const companiesSnapshot = await db.collection("companies")
      .where("userId", "==", userId)
      .get();
    
    const batch = db.batch();
    companiesSnapshot.docs.forEach(companyDoc => {
      batch.update(companyDoc.ref, {
        subscriptionActive: true,
        subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(expirationDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    
    if (!companiesSnapshot.empty) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      payjpId: payjpId,
      payjpType: (planId === "1year" || planId === "1year_legacy") ? "subscription" : "charge",
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
