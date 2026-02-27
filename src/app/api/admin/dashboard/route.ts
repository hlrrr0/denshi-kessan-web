import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import admin from "firebase-admin";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24時間（1日1回）キャッシュ
const CACHE_DOC_PATH = "admin/dashboard_stats";

// キャッシュから統計を取得（有効期限内なら返す）
async function getCachedStats(
  db: admin.firestore.Firestore
): Promise<any | null> {
  const doc = await db.doc(CACHE_DOC_PATH).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  const cachedAt = data.cachedAt?.toDate?.();
  if (!cachedAt) return null;

  const age = Date.now() - cachedAt.getTime();
  if (age > CACHE_TTL_MS) return null;

  return { ...data, cachedAt: cachedAt.toISOString() };
}

// 全データから統計を集計してキャッシュに保存
async function computeAndCacheStats(
  db: admin.firestore.Firestore
): Promise<any> {
  const usersSnap = await db.collection("users").get();
  const totalUsers = usersSnap.size;

  let activeSubscriptions = 0;
  let expiredSubscriptions = 0;
  let noSubscription = 0;
  const planBreakdown: Record<string, number> = {};
  const now = new Date();

  for (const userDoc of usersSnap.docs) {
    const subDoc = await db
      .collection("users")
      .doc(userDoc.id)
      .collection("subscription")
      .doc("current")
      .get();

    if (!subDoc.exists) {
      noSubscription++;
      continue;
    }

    const sub = subDoc.data()!;
    const expDate = sub.expirationDate?.toDate?.();
    const isActive = sub.active && expDate && expDate > now;

    if (isActive) {
      activeSubscriptions++;
      const planId = sub.subscriptionPlanId || "unknown";
      planBreakdown[planId] = (planBreakdown[planId] || 0) + 1;
    } else {
      expiredSubscriptions++;
    }
  }

  const [companiesSnap, noticesSnap] = await Promise.all([
    db.collectionGroup("company_information").get(),
    db.collectionGroup("notices").get(),
  ]);

  const stats = {
    totalUsers,
    activeSubscriptions,
    expiredSubscriptions,
    noSubscription,
    totalCompanies: companiesSnap.size,
    totalNotices: noticesSnap.size,
    planBreakdown,
    cachedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Firestoreにキャッシュ保存
  await db.doc(CACHE_DOC_PATH).set(stats);

  return {
    ...stats,
    cachedAt: new Date().toISOString(),
  };
}

// ダッシュボード統計情報を取得（キャッシュ付き）
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdmin(request);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 500 }
      );
    }

    const forceRefresh =
      new URL(request.url).searchParams.get("refresh") === "1";

    // キャッシュが有効ならそれを返す
    if (!forceRefresh) {
      const cached = await getCachedStats(db);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // キャッシュなし or 期限切れ or 強制更新 → 再集計
    const stats = await computeAndCacheStats(db);
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "統計情報の取得に失敗しました", details: error.message },
      { status: 500 }
    );
  }
}
