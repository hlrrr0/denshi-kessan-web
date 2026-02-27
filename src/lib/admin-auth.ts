// 管理者認証ヘルパー（サーバーサイド）
import { verifyAuthToken } from "./auth-server";
import { getFirebaseAdmin } from "./firebase-admin";

const ADMIN_EMAILS = [
  "hiroki.imai@super-shift.co.jp",
  "hiroki19910602@gmail.com",
];

/**
 * 管理者認証を検証する。
 * IDトークンを検証し、管理者メールアドレスかどうかを確認する。
 */
export async function verifyAdmin(
  request: Request
): Promise<{ uid: string; email: string } | { error: string; status: number }> {
  const result = await verifyAuthToken(request);

  if ("error" in result) {
    return result;
  }

  const db = getFirebaseAdmin();
  if (!db) {
    return { error: "Firebase is not configured", status: 500 };
  }

  // ユーザーのメールアドレスを取得
  const userDoc = await db.collection("users").doc(result.uid).get();
  const email = userDoc.data()?.email || "";

  if (!ADMIN_EMAILS.includes(email)) {
    return { error: "管理者権限がありません", status: 403 };
  }

  return { uid: result.uid, email };
}
