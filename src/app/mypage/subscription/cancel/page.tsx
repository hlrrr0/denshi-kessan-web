"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/payjp";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface SubscriptionData {
  subscriptionPlanId: string;
  active: boolean;
  expirationDate: any;
  automaticRenewalFlag: boolean;
  payjpId?: string;
  payjpType?: string;
}

export default function CancelSubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
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
        
        // 期限チェック
        const expirationDate = subscription.expirationDate?.toDate();
        const isExpired = expirationDate ? new Date() > expirationDate : true;
        const isActive = subscription.active && !isExpired;
        
        setSubscriptionData({
          subscriptionPlanId: subscription.subscriptionPlanId || "",
          active: isActive, // 期限チェック済み
          expirationDate: subscription.expirationDate,
          automaticRenewalFlag: subscription.automaticRenewalFlag || false,
          payjpId: subscription.payjpId,
          payjpType: subscription.payjpType,
        });
      }
    } catch (error) {
    }
  };

  const handleCancel = async () => {
    if (!user) {
      setMessage({ type: "error", text: "ログインしてください" });
      return;
    }

    if (!subscriptionData?.automaticRenewalFlag) {
      setMessage({ type: "error", text: "キャンセル可能な定期課金がありません" });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const response = await fetchWithAuth("/api/payjp/cancel-subscription", {
        method: "POST",
        body: JSON.stringify({
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "キャンセルに失敗しました");
      }

      setMessage({ 
        type: "success", 
        text: "定期課金をキャンセルしました。有効期限までサービスをご利用いただけます。マイページに戻ります..." 
      });
      
      setTimeout(() => {
        router.push("/mypage");
      }, 3000);
    } catch (error: any) {
      setMessage({ type: "error", text: "キャンセルに失敗しました: " + (error.message || "不明なエラー") });
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

  if (!subscriptionData || !subscriptionData.automaticRenewalFlag || subscriptionData.payjpType !== "subscription") {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-16">
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-yellow-900 mb-2">
                  キャンセル可能な定期課金がありません
                </h2>
                <p className="text-yellow-800 mb-4">
                  自動更新の定期課金に登録されていないため、キャンセルできません。
                </p>
                <button
                  onClick={() => router.push("/mypage")}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  ← マイページに戻る
                </button>
              </div>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.subscriptionPlanId);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push("/mypage")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
            >
              ← マイページに戻る
            </button>

            <h1 className="text-3xl font-bold mb-8">定期課金のキャンセル</h1>

            {message && (
              <div className={`mb-6 p-4 rounded ${
                message.type === "success" 
                  ? "bg-green-100 border border-green-400 text-green-700" 
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}>
                {message.text}
              </div>
            )}

            {/* 現在のプラン情報 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">現在のプラン</h2>
              <div className="space-y-3">
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-gray-600">プラン名</span>
                  <span className="font-semibold">{plan?.name || "不明"}</span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-gray-600">料金</span>
                  <span className="font-semibold">{formatPrice(plan?.price || 0)} / 年</span>
                </div>
                <div className="flex justify-between pb-3 border-b">
                  <span className="text-gray-600">有効期限</span>
                  <span className="font-semibold">
                    {subscriptionData.expirationDate?.toDate?.()?.toLocaleDateString() || "不明"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">決済タイプ</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    定期課金（自動更新）
                  </span>
                </div>
              </div>
            </div>

            {/* 注意事項 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-3">キャンセルについて</h3>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>✓ 定期課金をキャンセルすると、次回以降の自動更新が停止されます</li>
                <li>✓ 現在の有効期限（{subscriptionData.expirationDate?.toDate?.()?.toLocaleDateString()}）まではサービスをご利用いただけます</li>
                <li>✓ 有効期限後にサービスを継続したい場合は、再度プランに登録する必要があります</li>
                <li>✓ 既に支払い済みの料金の返金はできません</li>
              </ul>
            </div>

            {/* キャンセルボタン */}
            <div className="space-y-3">
              <button
                onClick={handleCancel}
                disabled={processing}
                className="w-full bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
              >
                {processing ? "処理中..." : "定期課金をキャンセルする"}
              </button>
              <button
                onClick={() => router.push("/mypage")}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                キャンセルせずに戻る
              </button>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
