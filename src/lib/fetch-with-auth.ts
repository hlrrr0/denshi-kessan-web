// 認証付きAPIリクエストヘルパー（クライアントサイド）
import { auth } from "./firebase";

/**
 * Firebase Auth の ID トークン付きで fetch を行う。
 * Authorization: Bearer <token> ヘッダーを自動的に付与する。
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const currentUser = auth?.currentUser;

  if (!currentUser) {
    throw new Error("ログインしていません");
  }

  const idToken = await currentUser.getIdToken();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${idToken}`);
  headers.set("Content-Type", "application/json");

  return fetch(url, {
    ...options,
    headers,
  });
}
