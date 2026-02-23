"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/payjp";

interface SubscriptionData {
  subscriptionPlanId: string;
  active: boolean;
  expirationDate: any;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadSubscriptionData(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadSubscriptionData = async (currentUser: User) => {
    if (!db) return;

    try {
      const subscriptionDocRef = doc(db, "users", currentUser.uid, "subscription", "current");
      const subscriptionSnap = await getDoc(subscriptionDocRef);
      
      if (subscriptionSnap.exists()) {
        const subscription = subscriptionSnap.data();
        setCurrentSubscription({
          subscriptionPlanId: subscription.subscriptionPlanId || "",
          active: subscription.active || false,
          expirationDate: subscription.expirationDate,
        });
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      setMessage({ type: "error", text: "プランを選択してください" });
      return;
    }

    if (!user) {
      setMessage({ type: "error", text: "ログインしてください" });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // クレジットカードが登録されているか確認（v1対応）
      const userDocRef = doc(db!, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() || !userDoc.data().payjpCardId) {
        setMessage({ type: "error", text: "先にクレジットカードを登録してください" });
        setProcessing(false);
        return;
      }

      // TODO: 決済API呼び出し
      const response = await fetch("/api/payjp/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan,
          userId: user.uid,
        }),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || errorData.details || "決済に失敗しました");
      }

      const data = await response.json();
      console.log("Subscription successful:", data);
      
      setMessage({ type: "success", text: "サブスクリプションに登録しました！マイページに戻ります..." });
      
      setTimeout(() => {
        router.push("/mypage");
      }, 2000);
    } catch (error: any) {
      console.error("Subscription error:", error);
      setMessage({ type: "error", text: "登録に失敗しました: " + (error.message || "不明なエラー") });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => router.push("/mypage")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
              >
                ← マイページに戻る
              </button>
              <h1 className="text-3xl font-bold">サブスクリプションプラン選択</h1>
              <p className="text-gray-600 mt-2">
                決算公告の継続的な管理に最適なプランをお選びください
              </p>
            </div>

            {/* 現在のプラン表示 */}
            {currentSubscription && currentSubscription.active && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h2 className="font-semibold text-blue-900 mb-2">現在のプラン</h2>
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {SUBSCRIPTION_PLANS.find(p => p.id === currentSubscription.subscriptionPlanId)?.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    有効期限: {currentSubscription.expirationDate?.toDate?.()?.toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}

            {message && (
              <div className={`mb-6 p-4 rounded ${
                message.type === "success" 
                  ? "bg-green-100 border border-green-400 text-green-700" 
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}>
                {message.text}
              </div>
            )}

            {/* プラン選択 */}
            <div className="space-y-4 mb-8">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                    selectedPlan === plan.id 
                      ? "border-2 border-blue-600 ring-2 ring-blue-200" 
                      : "border border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={selectedPlan === plan.id}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="mt-1 mr-4"
                      />
                      <div>
                        <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className={`px-3 py-1 rounded-full font-semibold ${
                            plan.autoRenewal 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-green-100 text-green-700"
                          }`}>
                            {plan.autoRenewal ? "自動更新" : "一括払い"}
                          </span>
                          <span className="text-gray-500">
                            契約期間: {plan.periodMonths}ヶ月
                          </span>
                          {plan.id === "5year" && (
                            <span className="text-green-600 font-semibold">
                              （1年あたり¥784でお得！）
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {formatPrice(plan.price)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan.id === "1year" ? "年額" : "5年一括"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <h3 className="font-semibold text-yellow-900 mb-2">ご注意</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• クレジットカードの登録が必要です</li>
                <li>• 初回登録時に即時決済されます</li>
                <li>• <strong>1年プラン</strong>: 毎年自動で更新されますが、いつでもキャンセル可能です</li>
                <li>• <strong>5年プラン</strong>: 一括払いのため、期限後は自動更新されません</li>
                <li>• プラン変更は次回更新時に適用されます</li>
              </ul>
            </div>

            {/* 登録ボタン */}
            <button
              onClick={handleSubscribe}
              disabled={!selectedPlan || processing}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {processing ? "処理中..." : currentSubscription?.active ? "プランを変更" : "サブスクリプションに登録"}
            </button>

            {/* クレジットカード未登録の場合 */}
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push("/mypage/payment")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                クレジットカードを登録する →
              </button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
