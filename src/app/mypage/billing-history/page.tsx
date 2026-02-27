"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { formatPrice } from "@/lib/payjp";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface BillingHistoryItem {
  id: string;
  amount: number;
  planName: string;
  status: string;
  date: any;
  chargeId: string;
}

export default function BillingHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadBillingHistory(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadBillingHistory = async (currentUser: User) => {
    try {
      const response = await fetchWithAuth("/api/payjp/billing-history", {
        method: "POST",
        body: JSON.stringify({ userId: currentUser.uid }),
      });

      if (!response.ok) {
        throw new Error("決済履歴の取得に失敗しました");
      }

      const data = await response.json();
      
      // APIから取得したデータを変換
      const history = data.history.map((item: any) => ({
        id: item.id,
        amount: item.amount,
        planName: item.planName,
        status: item.status,
        date: new Date(item.date),
        chargeId: item.chargeId,
      }));
      
      setBillingHistory(history);
    } catch (error) {
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => router.push("/mypage")}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
              >
                ← マイページに戻る
              </button>
              <h1 className="text-3xl font-bold">決済履歴</h1>
              <p className="text-gray-600 mt-2">
                これまでの決済履歴を確認できます
              </p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {billingHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          日付
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          プラン
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ステータス
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          取引ID
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {billingHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.date.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.planName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatPrice(item.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              item.status === "成功" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {item.chargeId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mb-4">決済履歴はまだありません</p>
                  <button
                    onClick={() => router.push("/mypage/subscription")}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    サブスクリプションに登録する →
                  </button>
                </div>
              )}
            </div>

            {/* 注意事項 */}
            <div className="mt-8 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">ご注意</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 決済履歴は過去2年分まで表示されます</li>
                <li>• 決済に関するお問い合わせは support-denshi-koukoku@xiami.jp までご連絡ください</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
