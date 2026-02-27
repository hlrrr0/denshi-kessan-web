"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { SUBSCRIPTION_PLANS, getAvailablePlans, getPlansForUser, formatPrice } from "@/lib/payjp";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface SubscriptionData {
  subscriptionPlanId: string;
  active: boolean;
  expirationDate: any;
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">読み込み中...</p></div>}>
      <SubscriptionPageContent />
    </Suspense>
  );
}

function SubscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromQuery = searchParams.get("plan");
  const [user, setUser] = useState<User | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(planFromQuery || "");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
        
        // 期限チェック: 有効期限が現在日時より後かどうか
        const expirationDate = subscription.expirationDate?.toDate();
        const isExpired = expirationDate ? new Date() > expirationDate : true;
        const isActive = subscription.active && !isExpired;
        
        setCurrentSubscription({
          subscriptionPlanId: subscription.subscriptionPlanId || "",
          active: isActive, // 期限チェック済みのactive状態
          expirationDate: subscription.expirationDate,
        });
      }
    } catch (error) {
    }
  };

  const handleSubscribeClick = () => {
    if (!selectedPlan) {
      setMessage({ type: "error", text: "プランを選択してください" });
      return;
    }

    if (!user) {
      setMessage({ type: "error", text: "ログインしてください" });
      return;
    }

    // 既にアクティブなサブスクリプションがあり、有効期限が1年以上残っている場合は確認ポップアップ
    if (currentSubscription?.active && currentSubscription.expirationDate) {
      const expDate = currentSubscription.expirationDate.toDate?.() || new Date(currentSubscription.expirationDate);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      if (expDate > oneYearFromNow) {
        setShowConfirm(true);
        return;
      }
    }

    handleSubscribe();
  };

  const handleSubscribe = async () => {
    setShowConfirm(false);

    if (!selectedPlan || !user) return;

    setProcessing(true);
    setMessage(null);

    try {
      // クレジットカードが登録されているか確認（v1対応）
      const userDocRef = doc(db!, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists() || !userDoc.data().payjpCardId) {
        setMessage({ type: "error", text: "クレジットカードが未登録です。カード登録画面へ移動します..." });
        setProcessing(false);
        setTimeout(() => {
          router.push(`/mypage/payment?redirect=subscription&plan=${selectedPlan}`);
        }, 800);
        return;
      }

      const response = await fetchWithAuth("/api/payjp/subscribe", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlan,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "決済に失敗しました");
      }

      const data = await response.json();
      
      setMessage({ type: "success", text: "サブスクリプションに登録しました！マイページに戻ります..." });
      
      setTimeout(() => {
        router.push("/mypage");
      }, 800);
    } catch (error: any) {
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
        {/* 確認ポップアップ */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">プラン変更の確認</h3>
              <p className="text-gray-700 mb-2">
                現在のプランの有効期限がまだ<strong>1年以上</strong>残っています。
              </p>
              <p className="text-sm text-gray-600 mb-2">
                現在の有効期限: <strong>{currentSubscription?.expirationDate?.toDate?.()?.toLocaleDateString()}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-6">
                プランを変更すると、現在の有効期限に新しいプランの期間が加算されます。本当にプランを変更しますか？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSubscribe}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  変更する
                </button>
              </div>
            </div>
          </div>
        )}

        {/* フルスクリーンローディングオーバーレイ */}
        {processing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
              <svg className="animate-spin h-10 w-10 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-900 font-bold text-lg">決済を処理中...</p>
              <p className="text-gray-500 text-sm">しばらくお待ちください</p>
            </div>
          </div>
        )}
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
              {getPlansForUser(currentSubscription?.subscriptionPlanId).map((plan) => (
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
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{plan.name}</h3>
                          {plan.legacy && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">
                              旧価格
                            </span>
                          )}
                        </div>
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
                              （1年あたり¥3,080でお得！）
                            </span>
                          )}
                          {plan.id === "10year" && (
                            <span className="text-green-600 font-semibold">
                              （1年あたり¥2,200で最もお得！）
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
                        {plan.periodMonths <= 12 ? "年額" : `${plan.periodMonths / 12}年一括`}
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
              onClick={handleSubscribeClick}
              disabled={!selectedPlan || processing}
              className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  処理中...
                </span>
              ) : currentSubscription?.active ? "プランを変更" : "サブスクリプションに登録"}
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
