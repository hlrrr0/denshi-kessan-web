import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuthAndUserId } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, paymentMethodId } = body;

    if (!userId || !paymentMethodId) {
      return NextResponse.json(
        { error: "userId and paymentMethodId are required" },
        { status: 400 }
      );
    }

    // 認証チェック
    const authResult = await verifyAuthAndUserId(request, userId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Firebase Admin を初期化
    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 500 }
      );
    }

    // Firestoreにpayment_method_idを保存
    await db.collection("users").doc(userId).set(
      {
        payjpPaymentMethodId: paymentMethodId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      message: "Payment method saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving payment method:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save payment method" },
      { status: 500 }
    );
  }
}
