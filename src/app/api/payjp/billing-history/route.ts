import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAuthAndUserId } from "@/lib/auth-server";
import Payjp from "payjp";

function getPayjp() {
  return Payjp(process.env.PAYJP_SECRET_KEY!);
}

export async function POST(request: NextRequest) {
  try {
    const payjp = getPayjp();
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // 認証チェック
    const authResult = await verifyAuthAndUserId(request, userId);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Firebase Adminを取得
    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json(
        { error: "Firebase is not configured" },
        { status: 500 }
      );
    }

    // Firestoreからユーザー情報を取得
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const customerId = userData?.payjpCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { history: [] },
        { status: 200 }
      );
    }

    // Pay.jpからカスタマーのすべてのチャージを取得
    const charges = await payjp.charges.list({
      customer: customerId,
      limit: 100, // 最大100件まで取得
    });

    // チャージデータを整形
    const billingHistory = charges.data.map((charge: any) => {
      // プラン名を判定
      let planName = "決済";
      if (charge.amount === 980) {
        planName = "1年プラン（旧価格）";
      } else if (charge.amount === 3960) {
        planName = "1年プラン（自動更新）";
      } else if (charge.amount === 3920) {
        planName = "5年プラン（旧価格）";
      } else if (charge.amount === 15400) {
        planName = "5年プラン（一括払い）";
      } else if (charge.amount === 22000) {
        planName = "10年プラン（一括払い）";
      }

      // descriptionがあればそこからプラン名を取得
      if (charge.description) {
        if (charge.description.includes("1年") || charge.description.includes("yearly")) {
          planName = "1年プラン（自動更新）";
        } else if (charge.description.includes("5年") || charge.description.includes("5 years")) {
          planName = "5年プラン（一括払い）";
        } else if (charge.description.includes("10年") || charge.description.includes("10 years")) {
          planName = "10年プラン（一括払い）";
        }
      }

      return {
        id: charge.id,
        amount: charge.amount,
        planName,
        status: charge.paid ? "成功" : charge.refunded ? "返金済み" : "失敗",
        date: new Date(charge.created * 1000).toISOString(),
        chargeId: charge.id,
        description: charge.description || "",
      };
    });

    // 日付順（新しい順）にソート
    billingHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      history: billingHistory,
    });
  } catch (error: any) {
    console.error("Error fetching billing history:", error);
    return NextResponse.json(
      { error: error.message || "決済履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
