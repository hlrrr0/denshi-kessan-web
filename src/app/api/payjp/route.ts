import { NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import admin from "firebase-admin";

// Pay.jp v1 SDK（イベント検証用）
function getPayjp() {
  return require("payjp")(process.env.PAYJP_SECRET_KEY);
}

// Firestoreの collectionGroup クエリで payjpId からユーザーのサブスクリプションを検索
async function findSubscriptionByPayjpId(
  db: admin.firestore.Firestore,
  payjpId: string
) {
  const snapshot = await db
    .collectionGroup("subscription")
    .where("payjpId", "==", payjpId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  // パス: users/{userId}/subscription/current
  const userId = doc.ref.parent.parent?.id;
  return { userId, docRef: doc.ref, data: doc.data() };
}

// ユーザーが所有する全企業のサブスクリプション状態を更新
async function updateCompanySubscriptionStatus(
  db: admin.firestore.Firestore,
  userId: string,
  active: boolean,
  expiresAt: admin.firestore.Timestamp
) {
  const companiesSnapshot = await db
    .collection("users").doc(userId).collection("company_information")
    .get();

  if (companiesSnapshot.empty) return;

  const batch = db.batch();
  companiesSnapshot.docs.forEach((companyDoc) => {
    batch.update(companyDoc.ref, {
      subscriptionActive: active,
      subscriptionExpiresAt: expiresAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

// PAY.JP webhook handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const eventType: string = body.type;
    const eventData = body.data;

    if (!eventType || !eventData) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 500 }
      );
    }

    switch (eventType) {
      // ──────────────────────────────────────────────
      // 定期課金の自動更新成功
      // ──────────────────────────────────────────────
      case "subscription.renewed": {
        const subscriptionId: string = eventData.id;
        const currentPeriodEnd: number = eventData.current_period_end;

        if (!subscriptionId || !currentPeriodEnd) {
          return NextResponse.json(
            { error: "Missing subscription data" },
            { status: 400 }
          );
        }

        const result = await findSubscriptionByPayjpId(db, subscriptionId);
        if (!result || !result.userId) {
          // 当サービスに紐づかないイベントは無視（200を返す）
          return NextResponse.json({ received: true, message: "Subscription not found in our system" });
        }

        const newExpirationDate = new Date(currentPeriodEnd * 1000);
        const expirationTimestamp = admin.firestore.Timestamp.fromDate(newExpirationDate);

        // ユーザーのサブスクリプションを更新
        await result.docRef.update({
          expirationDate: expirationTimestamp,
          active: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 企業の非正規化フィールドも更新
        await updateCompanySubscriptionStatus(
          db,
          result.userId,
          true,
          expirationTimestamp
        );

        return NextResponse.json({
          received: true,
          message: "Subscription renewed successfully",
          subscriptionId,
          newExpirationDate: newExpirationDate.toISOString(),
        });
      }

      // ──────────────────────────────────────────────
      // 課金失敗（定期課金の自動更新時を含む）
      // ──────────────────────────────────────────────
      case "charge.failed": {
        // 課金失敗はログに記録するが、特別な処理は不要
        // 理由: expirationDate が過去になった時点で自動的に非公開になる仕組みが既にある
        // ユーザーはマイページで期限切れ警告を見てカード情報更新 → 再契約できる
        const chargeId: string = eventData.id;
        const customerId: string = eventData.customer;
        const failureMessage: string = eventData.failure_message || "Unknown";

        console.error(
          `[Webhook] charge.failed: chargeId=${chargeId}, customerId=${customerId}, reason=${failureMessage}`
        );

        return NextResponse.json({
          received: true,
          message: "Charge failure recorded",
        });
      }

      // ──────────────────────────────────────────────
      // 定期課金の削除（管理画面からの操作 or API経由）
      // ──────────────────────────────────────────────
      case "subscription.deleted": {
        const subscriptionId: string = eventData.id;

        if (!subscriptionId) {
          return NextResponse.json(
            { error: "Missing subscription ID" },
            { status: 400 }
          );
        }

        const result = await findSubscriptionByPayjpId(db, subscriptionId);
        if (!result || !result.userId) {
          return NextResponse.json({ received: true, message: "Subscription not found in our system" });
        }

        // 自動更新フラグをオフにする（期限までは有効のまま）
        await result.docRef.update({
          automaticRenewalFlag: false,
          canceledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
          received: true,
          message: "Subscription deletion recorded",
          subscriptionId,
        });
      }

      // ──────────────────────────────────────────────
      // その他のイベント（無視して200を返す）
      // ──────────────────────────────────────────────
      default: {
        return NextResponse.json({
          received: true,
          message: `Event type '${eventType}' not handled`,
        });
      }
    }
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
