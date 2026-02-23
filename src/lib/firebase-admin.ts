// Firebase Admin SDK (サーバーサイド専用)
import admin from "firebase-admin";

// Firebase Admin SDK の初期化（サーバーサイドのみ）
export function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  // 環境変数から認証情報を取得
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Firebase Admin credentials are missing");
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    return admin.firestore();
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}
