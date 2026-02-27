// PAY.JP関連のユーティリティ関数

// サブスクリプションプランの定義
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  periodMonths: number;
  description: string;
  autoRenewal: boolean; // 自動更新かどうか
  paymentType: "subscription" | "one-time"; // 決済タイプ
  legacy?: boolean; // 旧価格プラン（新規契約不可）
  payjpPlanId?: string; // Pay.jpのプランID（サブスクリプション用）
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  // 旧価格プラン（既存契約者のみ）
  {
    id: "1year_legacy",
    name: "1年プラン（旧価格）",
    price: 980,
    periodMonths: 12,
    description: "既存契約者向けの旧価格プランです。",
    autoRenewal: true,
    paymentType: "subscription",
    legacy: true,
    payjpPlanId: "yearly_plan_980",
  },
  {
    id: "5year_legacy",
    name: "5年プラン（旧価格）",
    price: 3920,
    periodMonths: 60,
    description: "既存契約者向けの旧価格プランです。",
    autoRenewal: false,
    paymentType: "one-time",
    legacy: true,
  },
  // 現行価格プラン
  {
    id: "1year",
    name: "1年プラン（自動更新）",
    price: 3960,
    periodMonths: 12,
    description: "1年ごとに自動で更新されます。いつでもキャンセル可能。",
    autoRenewal: true,
    paymentType: "subscription",
    payjpPlanId: "yearly_plan_3960",
  },
  {
    id: "5year",
    name: "5年プラン（一括払い）",
    price: 15400,
    periodMonths: 60,
    description: "5年分を一括でお支払い。年間あたり3,080円とお得です。",
    autoRenewal: false,
    paymentType: "one-time",
  },
  {
    id: "10year",
    name: "10年プラン（一括払い）",
    price: 22000,
    periodMonths: 120,
    description: "10年分を一括でお支払い。年間あたり2,200円と最もお得です。",
    autoRenewal: false,
    paymentType: "one-time",
  },
];

// 新規契約可能なプランのみを取得
export const getAvailablePlans = (): SubscriptionPlan[] => {
  return SUBSCRIPTION_PLANS.filter(plan => !plan.legacy);
};

// ユーザーの現在のプランに応じた選択可能プランを取得
// レガシープランユーザーは旧価格での更新が可能
export const getPlansForUser = (currentPlanId?: string): SubscriptionPlan[] => {
  const availablePlans = getAvailablePlans();
  
  if (!currentPlanId) return availablePlans;
  
  // 現在レガシープランの場合、そのレガシープランも選択肢に含める
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentPlanId);
  if (currentPlan?.legacy) {
    // 同じレガシーシリーズのプランを全て追加
    const legacyPlans = SUBSCRIPTION_PLANS.filter(p => p.legacy);
    return [...legacyPlans, ...availablePlans];
  }
  
  return availablePlans;
};

// Pay.jpの公開鍵（環境変数から取得）
export const getPayjpPublicKey = (): string => {
  return process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY || "";
};

// カード情報の表示用フォーマット（下4桁のみ）
export const formatCardNumber = (last4: string, brand: string): string => {
  return `${brand.toUpperCase()} **** **** **** ${last4}`;
};

// 有効期限のフォーマット
export const formatExpiryDate = (month: number, year: number): string => {
  return `${String(month).padStart(2, "0")}/${year}`;
};

// 金額を円表示にフォーマット
export const formatPrice = (price: number): string => {
  return `¥${price.toLocaleString()}`;
};
