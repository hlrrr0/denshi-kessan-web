import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import admin from "firebase-admin";

const CACHE_TTL_MS = 5 * 60 * 1000; // 5分キャッシュ
const CACHE_DOC_PATH = "admin/users_cache";
const PAGE_SIZE = 20;

interface CachedUser {
  uid: string;
  email: string;
  name: string;
  phone: string;
  payjpCustomerId: string;
  createdAt: string | null;
  companyName: string;
  companyCount: number;
  planId: string;
  subscriptionStatus: string; // active, expired, none
  expirationDate: string | null;
  automaticRenewal: boolean;
}

// 全ユーザーデータを集計してキャッシュに保存
async function buildAndCacheUserList(
  db: admin.firestore.Firestore
): Promise<CachedUser[]> {
  const usersSnap = await db.collection("users").get();
  const users: CachedUser[] = [];
  const now = new Date();

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const uid = userDoc.id;

    // 企業情報
    const companiesSnap = await db
      .collection("users")
      .doc(uid)
      .collection("company_information")
      .get();

    const firstCompany = companiesSnap.docs[0]?.data();

    // サブスクリプション
    const subDoc = await db
      .collection("users")
      .doc(uid)
      .collection("subscription")
      .doc("current")
      .get();

    let subscriptionStatus = "none";
    let planId = "";
    let expirationDate: string | null = null;
    let automaticRenewal = false;

    if (subDoc.exists) {
      const subData = subDoc.data()!;
      const expDate = subData.expirationDate?.toDate?.();
      const isActive = subData.active && expDate && expDate > now;
      subscriptionStatus = isActive ? "active" : "expired";
      planId = subData.subscriptionPlanId || "";
      expirationDate = expDate?.toISOString() || null;
      automaticRenewal = subData.automaticRenewalFlag || false;
    }

    users.push({
      uid,
      email: userData.email || "",
      name: userData.name || "",
      phone: userData.phone || "",
      payjpCustomerId: userData.payjpCustomerId || "",
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || null,
      companyName: firstCompany?.name || "",
      companyCount: companiesSnap.size,
      planId,
      subscriptionStatus,
      expirationDate,
      automaticRenewal,
    });
  }

  // 名前順ソート
  users.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  // Firestoreにキャッシュ保存（サブコレクションに分割保存すると大きすぎるので、1ドキュメントにJSON）
  await db.doc(CACHE_DOC_PATH).set({
    data: JSON.stringify(users),
    count: users.length,
    cachedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return users;
}

// キャッシュからユーザーリストを取得
async function getCachedUsers(
  db: admin.firestore.Firestore
): Promise<{ users: CachedUser[]; cachedAt: string } | null> {
  const doc = await db.doc(CACHE_DOC_PATH).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  const cachedAt = data.cachedAt?.toDate?.();
  if (!cachedAt) return null;

  const age = Date.now() - cachedAt.getTime();
  if (age > CACHE_TTL_MS) return null;

  try {
    return {
      users: JSON.parse(data.data),
      cachedAt: cachedAt.toISOString(),
    };
  } catch {
    return null;
  }
}

// ユーザー一覧取得（キャッシュ + ページネーション）
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const filter = searchParams.get("filter") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const forceRefresh = searchParams.get("refresh") === "1";

    // キャッシュから取得 or 再構築
    let allUsers: CachedUser[];
    let cachedAt: string;

    if (!forceRefresh) {
      const cached = await getCachedUsers(db);
      if (cached) {
        allUsers = cached.users;
        cachedAt = cached.cachedAt;
      } else {
        allUsers = await buildAndCacheUserList(db);
        cachedAt = new Date().toISOString();
      }
    } else {
      allUsers = await buildAndCacheUserList(db);
      cachedAt = new Date().toISOString();
    }

    // フィルター適用
    let filtered = allUsers;

    if (search) {
      filtered = filtered.filter((u) => {
        return (
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.companyName.toLowerCase().includes(search)
        );
      });
    }

    if (filter !== "all") {
      filtered = filtered.filter((u) => u.subscriptionStatus === filter);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (page - 1) * PAGE_SIZE;
    const pageUsers = filtered.slice(start, start + PAGE_SIZE);

    return NextResponse.json({
      users: pageUsers,
      total,
      page,
      totalPages,
      pageSize: PAGE_SIZE,
      cachedAt,
    });
  } catch (error: any) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "ユーザー一覧の取得に失敗しました", details: error.message },
      { status: 500 }
    );
  }
}
