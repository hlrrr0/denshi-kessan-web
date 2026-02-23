import { NextResponse } from "next/server";

// Pay.jp v1 SDK
const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

export async function POST(request: Request) {
  try {
    // 既存のプランを確認
    let plan;
    try {
      plan = await payjp.plans.retrieve("yearly_plan_980");
      console.log("Plan already exists:", plan.id);
      return NextResponse.json({
        success: true,
        plan: plan,
        message: "Plan already exists",
      });
    } catch (error: any) {
      // プランが存在しない場合は作成
      if (error.status === 404) {
        console.log("Creating new plan...");
        
        plan = await payjp.plans.create({
          id: "yearly_plan_980",
          amount: 980,
          currency: "jpy",
          interval: "year", // 年次課金
          name: "1年プラン",
        });
        
        console.log("Plan created:", plan.id);
        
        return NextResponse.json({
          success: true,
          plan: plan,
          message: "Plan created successfully",
        });
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error("Plan creation error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create plan", 
        details: error.message,
        body: error.body 
      },
      { status: 500 }
    );
  }
}
