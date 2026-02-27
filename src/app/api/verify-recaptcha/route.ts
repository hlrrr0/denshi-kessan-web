import { NextRequest, NextResponse } from "next/server";

interface RecaptchaVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "トークンが提供されていません" },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not configured");
      return NextResponse.json(
        { success: false, error: "サーバー設定エラー" },
        { status: 500 }
      );
    }

    // GoogleのreCAPTCHA検証エンドポイントにリクエスト
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const verifyResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const verifyData: RecaptchaVerifyResponse = await verifyResponse.json();

    // reCAPTCHA v3では、スコアが0.5以上であれば人間とみなす
    if (verifyData.success && (verifyData.score ?? 0) >= 0.5) {
      return NextResponse.json({
        success: true,
        score: verifyData.score,
      });
    }

    // 検証失敗
    return NextResponse.json(
      {
        success: false,
        error: "reCAPTCHA検証に失敗しました",
        score: verifyData.score,
        errorCodes: verifyData["error-codes"],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return NextResponse.json(
      { success: false, error: "検証処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
