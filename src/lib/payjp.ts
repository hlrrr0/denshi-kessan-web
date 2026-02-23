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
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "1year",
    name: "1年プラン（自動更新）",
    price: 980,
    periodMonths: 12,
    description: "1年ごとに自動で更新されます。いつでもキャンセル可能。",
    autoRenewal: true,
    paymentType: "subscription",
  },
  {
    id: "5year",
    name: "5年プラン（一括払い）",
    price: 3920,
    periodMonths: 60,
    description: "5年分を一括でお支払い。期限後は再購入が必要です。",
    autoRenewal: false,
    paymentType: "one-time",
  },
];

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
