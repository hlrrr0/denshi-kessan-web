import { NextResponse } from "next/server";

// PAY.JP webhook handler
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ここでwebhookイベントを処理
    console.log("PAY.JP webhook received:", body);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
