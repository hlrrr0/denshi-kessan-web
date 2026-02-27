// サーバーサイド認証ヘルパー
import admin from "firebase-admin";
import { getFirebaseAdmin } from "./firebase-admin";

/**
 * Authorization ヘッダーから Firebase Auth ID トークンを検証し、
 * リクエストボディの userId と一致するか確認する。
 *
 * @returns 検証済みの userId、または null（エラー時）
 */
export async function verifyAuthToken(
  request: Request
): Promise<{ uid: string } | { error: string; status: number }> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "認証トークンがありません", status: 401 };
  }

  const idToken = authHeader.split("Bearer ")[1];

  if (!idToken) {
    return { error: "認証トークンが不正です", status: 401 };
  }

  // Firebase Admin が初期化されていることを確認
  getFirebaseAdmin();

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error("Token verification failed:", error);
    return { error: "認証トークンが無効です", status: 401 };
  }
}

/**
 * 認証トークンを検証し、リクエストボディの userId と一致するか確認する。
 * 不一致の場合は 403 を返す。
 */
export async function verifyAuthAndUserId(
  request: Request,
  userId: string
): Promise<{ uid: string } | { error: string; status: number }> {
  const result = await verifyAuthToken(request);

  if ("error" in result) {
    return result;
  }

  if (result.uid !== userId) {
    return { error: "権限がありません", status: 403 };
  }

  return result;
}
