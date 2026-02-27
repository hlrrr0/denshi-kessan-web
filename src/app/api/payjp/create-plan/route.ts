import { NextResponse } from "next/server";

// Pay.jp v1 SDK
function getPayjp() {
  return require("payjp")(process.env.PAYJP_SECRET_KEY);
}

// プラン定義
const PLANS = [
  {
    id: "yearly_plan_980",
    amount: 980,
    name: "1年プラン（旧価格）",
    description: "既存契約者向けの旧価格プラン"
  },
  {
    id: "yearly_plan_3960",
    amount: 3960,
    name: "1年プラン",
    description: "新規契約者向けの現行価格プラン"
  }
];

export async function POST(request: Request) {
  try {
    const payjp = getPayjp();
    const results = [];
    
    // 全てのプランを確認または作成
    for (const planDef of PLANS) {
      try {
        // 既存のプランを確認
        const plan = await payjp.plans.retrieve(planDef.id);
        results.push({
          planId: plan.id,
          status: "exists",
          amount: plan.amount
        });
      } catch (error: any) {
        // プランが存在しない場合は作成
        if (error.status === 404) {
          const plan = await payjp.plans.create({
            id: planDef.id,
            amount: planDef.amount,
            currency: "jpy",
            interval: "year",
            name: planDef.name,
          });
          
          results.push({
            planId: plan.id,
            status: "created",
            amount: plan.amount
          });
        } else {
          throw error;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      plans: results,
      message: "Plans setup completed"
    });
  } catch (error: any) {
    console.error("Plan setup error:", error);
    return NextResponse.json(
      { 
        error: "Failed to setup plans", 
        details: error.message,
        body: error.body 
      },
      { status: 500 }
    );
  }
}
