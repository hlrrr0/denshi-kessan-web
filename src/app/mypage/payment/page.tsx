"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { getPayjpPublicKey } from "@/lib/payjp";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

declare global {
  interface Window {
    Payjp?: any;
  }
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">読み込み中...</p></div>}>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const planFromQuery = searchParams.get("plan");
  const [user, setUser] = useState<User | null>(null);
  const [hasCard, setHasCard] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [payjpLoaded, setPayjpLoaded] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [payjpInstance, setPayjpInstance] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [shouldMountCard, setShouldMountCard] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadCardData(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Pay.jp v1 payjp.jsスクリプトを動的に読み込む
  useEffect(() => {
    if (typeof window === "undefined") return;

    // すでに読み込まれているかチェック
    if (window.Payjp) {
      setPayjpLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.pay.jp/v2/pay.js";
    script.async = true;
    script.onload = () => {
      setPayjpLoaded(true);
    };
    script.onerror = () => {
      setMessage({ type: "error", text: "決済システムの読み込みに失敗しました" });
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // カードフォームがDOMに追加された後にカード要素をマウント
  useEffect(() => {
    if (showCardForm && shouldMountCard && payjpInstance && !cardElement) {
      const mountCardElement = () => {
        const cardElementDiv = document.getElementById('card-element');
        if (!cardElementDiv) {
          setTimeout(mountCardElement, 100);
          return;
        }

        try {
          const elements = payjpInstance.elements();
          const card = elements.create('card', {
            style: {
              base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                  color: '#aab7c4'
                }
              },
              invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
              }
            }
          });

          card.mount('#card-element');
          setCardElement(card);
          setShouldMountCard(false);
        } catch (error) {
          setMessage({ type: "error", text: "カードフォームの表示に失敗しました" });
        }
      };

      mountCardElement();
    }
  }, [showCardForm, shouldMountCard, payjpInstance, cardElement]);

  const loadCardData = async (currentUser: User) => {
    if (!db) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        // payjpCardIdがある場合のみカード登録済みとみなす
        setHasCard(!!data.payjpCardId);
      }
    } catch (error) {
    }
  };

  const handleAddCard = () => {
    if (!payjpLoaded || !window.Payjp) {
      setMessage({ type: "error", text: "決済システムがまだ読み込まれていません" });
      return;
    }

    try {
      const publicKey = getPayjpPublicKey();
      if (!publicKey) {
        setMessage({ type: "error", text: "公開鍵が設定されていません" });
        return;
      }

      // Payjpインスタンスを初期化
      const payjp = window.Payjp(publicKey);
      setPayjpInstance(payjp);
      setShowCardForm(true);
      setShouldMountCard(true);
    } catch (error) {
      setMessage({ type: "error", text: "カードフォームの初期化に失敗しました" });
    }
  };

  const handleSubmitCard = async () => {
    if (!payjpInstance || !cardElement || !user) {
      setMessage({ type: "error", text: "カード情報が入力されていません" });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      // トークンを作成
      const result = await payjpInstance.createToken(cardElement);

      if (result.error) {
        const errorMsg = result.error.message || result.error.code || "カード情報が正しくありません。カード番号・有効期限・CVC を確認してください。";
        throw new Error(errorMsg);
      }

      const token = result.id;
      if (!token) {
        throw new Error("トークンの取得に失敗しました。カード情報を確認してください。");
      }

      // トークンをサーバーに送信してCustomerに登録
      const response = await fetchWithAuth("/api/payjp/register-card", {
        method: "POST",
        body: JSON.stringify({
          userId: user.uid,
          token: token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "カードの登録に失敗しました");
      }

      const data = await response.json();

      setShowCardForm(false);
      setShouldMountCard(false);
      setHasCard(true);

      // カードエレメントをクリア
      if (cardElement) {
        cardElement.unmount();
        setCardElement(null);
      }

      // サブスクリプション登録から遷移してきた場合、自動で戻す
      if (redirectTo === "subscription" && planFromQuery) {
        setMessage({ type: "success", text: "カードを登録しました！サブスクリプション登録に戻ります..." });
        setTimeout(() => {
          router.push(`/mypage/subscription?plan=${planFromQuery}`);
        }, 800);
      } else {
        setMessage({ type: "success", text: "カードを登録しました！" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "カードの登録に失敗しました" });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!user) return;
    if (!confirm("登録されているカードを削除しますか？")) return;

    setProcessing(true);
    setMessage(null);

    try {
      const response = await fetchWithAuth("/api/payjp/delete-card", {
        method: "POST",
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "カードの削除に失敗しました");
      }

      setMessage({ type: "success", text: "カードを削除しました" });
      setHasCard(false);
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "カードの削除に失敗しました" });
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
        {/* フルスクリーンローディングオーバーレイ */}
        {processing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
              <svg className="animate-spin h-10 w-10 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-900 font-bold text-lg">カード情報を処理中...</p>
              <p className="text-gray-500 text-sm">しばらくお待ちください</p>
            </div>
          </div>
        )}
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => router.push("/mypage")}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4"
            >
              ← マイページに戻る
            </button>

            <h1 className="text-3xl font-bold mb-8">クレジットカード管理</h1>

            {message && (
              <div className={`mb-6 p-4 rounded ${
                message.type === "success" 
                  ? "bg-green-100 border border-green-400 text-green-700" 
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}>
                {message.text}
              </div>
            )}

            {/* カード登録状態 */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">登録状態</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">
                    {hasCard ? "クレジットカードが登録されています" : "クレジットカードが未登録です"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!showCardForm && !hasCard && (
                    <button
                      onClick={handleAddCard}
                      disabled={!payjpLoaded}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      カードを追加
                    </button>
                  )}
                  {hasCard && (
                    <button
                      onClick={handleDeleteCard}
                      disabled={processing}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
                    >
                      カードを削除
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* カード入力フォーム */}
            {showCardForm && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">カード情報入力</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カード情報
                  </label>
                  <div id="card-element" className="border border-gray-300 rounded p-3 min-h-[40px]">
                    {/* Payjp card element will be mounted here */}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    テスト用カード番号: 4242424242424242
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmitCard}
                    disabled={processing}
                    className="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        登録中...
                      </span>
                    ) : "カードを登録"}
                  </button>
                  <button
                    onClick={() => {
                      setShowCardForm(false);
                      setShouldMountCard(false);
                      if (cardElement) {
                        cardElement.unmount();
                        setCardElement(null);
                      }
                    }}
                    disabled={processing}
                    className="px-6 bg-gray-200 text-gray-700 py-3 rounded hover:bg-gray-300"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}

            {/* 注意事項 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <h3 className="font-semibold text-blue-900 mb-2">ご注意</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• クレジットカード情報は安全に暗号化されて保存されます</li>
                <li>• サブスクリプションの決済に使用されます</li>
                <li>• カード情報はいつでも変更・削除できます</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
