import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirebaseAdmin } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const { userId, paymentMethodId } = await request.json();

    if (!userId || !paymentMethodId) {
      return NextResponse.json(
        { error: "userId and paymentMethodId are required" },
        { status: 400 }
      );
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

    console.log(`Saved payment method ${paymentMethodId} for user ${userId}`);

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
