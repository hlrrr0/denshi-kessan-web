"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { SUBSCRIPTION_PLANS, getAvailablePlans, formatPrice } from "@/lib/payjp";

interface UserData {
  name: string;
  email: string;
  phone: string;
  payjpCustomerId?: string;
  payjpCardId?: string;
}

interface SubscriptionData {
  subscriptionPlanId: string;
  active: boolean;
  expirationDate: any;
  automaticRenewalFlag: boolean;
  createdAt: any;
  payjpSubscriptionId?: string;
  actualPrice?: number; // 実際の契約価格（レガシープラン対応）
}

interface CompanyData {
  id: string;
  name: string;
  nameFurigana: string;
  establishmentDate: string;
  representativeName: string;
  capital: number;
  amountOfSales: number;
  numberOfEmployees: number;
  businessDescription: string;
  officeAddress: string;
  officialHomepageUrl: string;
  accountClosingMonth: number;
}

interface NoticeData {
  id: string;
  title: string;
  pdfUrl: string;
  pdfPath?: string;
  createdAt: any;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadUserData(currentUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (currentUser: User) => {
    if (!db) return;

    try {
      // ユーザー情報を取得（ドキュメントIDがuidと同じ）
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userDoc = userDocSnap.data();
        setUserData({
          name: userDoc.name || "",
          email: userDoc.email || currentUser.email || "",
          phone: userDoc.phone || "",
          payjpCustomerId: userDoc.payjpCustomerId || "",
          payjpCardId: userDoc.payjpCardId || "",
        });

        // サブスクリプション情報を取得
        const subscriptionDocRef = doc(db, "users", currentUser.uid, "subscription", "current");
        const subscriptionSnap = await getDoc(subscriptionDocRef);
        
        if (subscriptionSnap.exists()) {
          const subscription = subscriptionSnap.data();
          
          // 期限チェック: 有効期限が現在日時より後かどうか
          const expirationDate = subscription.expirationDate?.toDate();
          const isExpired = expirationDate ? new Date() > expirationDate : true;
          const isActive = subscription.active && !isExpired;
          
          setSubscriptionData({
            subscriptionPlanId: subscription.subscriptionPlanId || "",
            active: isActive, // 期限チェック済みのactive状態
            expirationDate: subscription.expirationDate,
            automaticRenewalFlag: subscription.automaticRenewalFlag || false,
            createdAt: subscription.createdAt,
            payjpSubscriptionId: subscription.payjpSubscriptionId || "",
          });
        } else {
        }
      } else {
        // Firestoreにデータがない場合、Authの情報を使用
        setUserData({
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          phone: "",
        });
      }

      // 会社情報を取得（users/{uid}/company_information サブコレクション）
      const companiesRef = collection(db, "users", currentUser.uid, "company_information");
      const companySnapshot = await getDocs(companiesRef);

      if (!companySnapshot.empty) {
        const companyDoc = companySnapshot.docs[0];
        const data = companyDoc.data();
        setCompanyData({
          id: companyDoc.id,
          name: data.name || "",
          nameFurigana: data.nameFurigana || "",
          establishmentDate: data.establishmentDate?.toDate ? data.establishmentDate.toDate().toLocaleDateString("ja-JP") : (data.establishmentDate || ""),
          representativeName: data.representativeName || "",
          capital: data.capital || 0,
          amountOfSales: data.amountOfSales || 0,
          numberOfEmployees: data.numberOfEmployees || 0,
          businessDescription: data.businessDescription || "",
          officeAddress: data.officeAddress || "",
          officialHomepageUrl: data.officialHomepageUrl || "",
          accountClosingMonth: data.accountClosingMonth || 0,
        });

        // 決算公告を取得
        const noticesRef = collection(db, "users", currentUser.uid, "company_information", companyDoc.id, "notices");
        const noticesSnapshot = await getDocs(noticesRef);
        const noticesData = noticesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NoticeData[];
        setNotices(noticesData);
      } else {
      }
    } catch (error: any) {
    }
  };

  const handleDeleteNotice = async (notice: NoticeData) => {
    if (!confirm(`「${notice.title}」を削除しますか？\nこの操作は取り消せません。`)) return;
    if (!db || !companyData) return;

    setDeleting(notice.id);
    try {
      // Firebase Storage からPDFを削除
      if (notice.pdfPath && storage) {
        try {
          const storageRef = ref(storage, notice.pdfPath);
          await deleteObject(storageRef);
        } catch (storageError: any) {
          // ファイルが既に存在しない場合は無視
          if (storageError.code !== "storage/object-not-found") {
            throw storageError;
          }
        }
      }

      // Firestore からドキュメントを削除
      await deleteDoc(doc(db, "users", user!.uid, "company_information", companyData.id, "notices", notice.id));

      // ローカルステートを更新
      setNotices((prev) => prev.filter((n) => n.id !== notice.id));
    } catch (error: any) {
      alert("削除に失敗しました。もう一度お試しください。");
    } finally {
      setDeleting(null);
    }
  };

  const settlementUrl = companyData && user
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/settlements/${user.uid}/${companyData.id}`
    : "";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(settlementUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-700 font-bold">読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 pb-4 border-b-2 border-gray-300">マイページ</h1>

          <div className="space-y-8">
            {/* サブスクリプション・決済情報 */}
            <section className="bg-gray-50 border-2 border-gray-300 p-6">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-300">
                <h2 className="text-lg font-bold text-gray-900">契約・決済情報</h2>
                <button
                  onClick={() => router.push("/mypage/subscription")}
                  className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-800"
                >
                  プラン変更
                </button>
              </div>
              {subscriptionData && subscriptionData.active ? (
                <div className="space-y-4">
                  {/* 現在のプラン */}
                  <div className="bg-white border-2 border-blue-700 p-5 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-gray-700">現在のプラン</span>
                      <span className="px-3 py-1 bg-green-700 text-white text-xs font-bold">
                        契約中
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-gray-900">
                        {SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.subscriptionPlanId)?.name || "不明"}
                      </span>
                      <span className="text-xl font-bold text-blue-700">
                        {formatPrice(
                          subscriptionData.actualPrice || 
                          SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.subscriptionPlanId)?.price || 
                          0
                        )}
                      </span>
                    </div>
                  </div>

                  {/* 契約詳細テーブル */}
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="border-b border-gray-300">
                        <td className="py-3 text-gray-700 font-bold w-40">有効期限</td>
                        <td className="py-3 text-gray-900">
                          {subscriptionData.expirationDate?.toDate?.()?.toLocaleDateString() || "不明"}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-3 text-gray-700 font-bold">決済タイプ</td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-900 font-medium">
                              {subscriptionData.automaticRenewalFlag ? "定期課金（自動更新）" : "一括払い"}
                            </span>
                            {subscriptionData.automaticRenewalFlag && (
                              <button
                                onClick={() => router.push("/mypage/subscription/cancel")}
                                className="px-3 py-1 border border-red-600 text-red-600 text-xs font-bold hover:bg-red-50"
                              >
                                解約手続き
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-300">
                        <td className="py-3 text-gray-700 font-bold">クレジットカード</td>
                        <td className="py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900">
                              {userData?.payjpCardId ? "登録済み" : "未登録"}
                            </span>
                            <button
                              onClick={() => router.push("/mypage/payment")}
                              className="px-4 py-1 border-2 border-blue-700 text-blue-700 text-sm font-bold hover:bg-blue-50"
                            >
                              {userData?.payjpCardId ? "カード変更" : "カード登録"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* 決済履歴リンク */}
                  <div className="pt-4 border-t border-gray-300 mt-4">
                    <button
                      onClick={() => router.push("/mypage/billing-history")}
                      className="w-full px-4 py-2 border-2 border-blue-700 text-blue-700 rounded font-bold hover:bg-blue-50"
                    >
                      決済履歴を表示 →
                    </button>
                  </div>
                </div>
              ) : subscriptionData ? (
                // 期限切れの場合
                <div>
                  <div className="bg-red-50 border-2 border-red-600 p-6 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="text-red-600 text-2xl font-bold flex-shrink-0">！</div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-red-900 mb-2">契約が期限切れです</h3>
                        <p className="text-sm text-gray-800 mb-2">
                          有効期限: {subscriptionData.expirationDate?.toDate?.()?.toLocaleDateString() || "不明"}
                        </p>
                        <p className="text-sm text-gray-800">
                          決算公告の公開を継続するには、プランに再登録してください。
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-300 p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">プラン一覧</h3>
                    <div className="space-y-4">
                      {getAvailablePlans().map((plan) => (
                        <div key={plan.id} className="border-b border-gray-300 pb-4 last:border-0">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900">{plan.name}</span>
                            <span className="font-bold text-blue-700 text-lg">{formatPrice(plan.price)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/mypage/subscription")}
                    className="w-full px-6 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800"
                  >
                    プランに再登録する
                  </button>
                </div>
              ) : (
                // 未登録の場合
                <div>
                  <p className="text-gray-700 mb-6 text-center">サブスクリプションプランに登録していません</p>
                  <div className="bg-white border border-gray-300 p-6 mb-6">
                    <h3 className="font-bold text-gray-900 mb-4">プラン一覧</h3>
                    <div className="space-y-4">
                      {getAvailablePlans().map((plan) => (
                        <div key={plan.id} className="border-b border-gray-300 pb-4 last:border-0">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900">{plan.name}</span>
                            <span className="font-bold text-blue-700 text-lg">{formatPrice(plan.price)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{plan.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/mypage/subscription")}
                    className="w-full px-6 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800"
                  >
                    プランに登録する
                  </button>
                </div>
              )}
            </section>

            {/* 登記に掲載のURL */}
            {companyData && subscriptionData?.active && (
              <section className="bg-gray-50 border-2 border-blue-700 p-6">
                <div className="mb-4 pb-3 border-b border-gray-300">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 text-blue-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    登記に掲載のURLはこちら
                  </h2>
                </div>
                <p className="text-sm text-gray-700 mb-3">登記簿への掲載URLとしてご利用ください。</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-white rounded border-2 border-gray-300 px-4 py-3">
                    <p className="text-sm text-gray-900 break-all font-mono">
                      {settlementUrl}
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="flex-shrink-0 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded border-2 border-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        コピーしました
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        URLをコピー
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-3">
                  <a
                    href={settlementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-700 font-bold hover:text-blue-800 underline"
                  >
                    公開ページを確認する →
                  </a>
                </div>
              </section>
            )}

            {/* アップロード済みファイル一覧 */}
            <section className="bg-gray-50 border-2 border-gray-300 p-6">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-300">
                <h2 className="text-lg font-bold text-gray-900">アップロード済みファイル一覧</h2>
                <button
                  onClick={() => router.push("/mypage/upload")}
                  className="px-4 py-2 bg-green-700 text-white rounded text-sm font-bold hover:bg-green-800"
                >
                  + 新規アップロード
                </button>
              </div>
              {notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.map((notice) => (
                    <div key={notice.id} className="bg-white border border-gray-300 p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{notice.title}</h3>
                        <p className="text-sm text-gray-600">
                          {notice.createdAt?.toDate?.()?.toLocaleDateString() || "日付不明"}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <a
                          href={notice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border-2 border-blue-700 text-blue-700 text-sm font-bold hover:bg-blue-50"
                        >
                          表示
                        </a>
                        <button
                          onClick={() => handleDeleteNotice(notice)}
                          disabled={deleting === notice.id}
                          className="px-4 py-2 border-2 border-red-600 text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === notice.id ? "削除中..." : "削除"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">アップロード済みのファイルはありません</p>
                  <button
                    onClick={() => router.push("/mypage/upload")}
                    className="px-6 py-3 bg-green-700 text-white rounded font-bold hover:bg-green-800"
                  >
                    決算公告をアップロード
                  </button>
                </div>
              )}
            </section>

            {/* 登録企業情報 */}
            <section className="bg-gray-50 border-2 border-gray-300 p-6">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-300">
                <h2 className="text-lg font-bold text-gray-900">登録企業情報</h2>
                <button
                  onClick={() => router.push("/mypage/edit")}
                  className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-800"
                >
                  編集
                </button>
              </div>
              {companyData ? (
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold w-48">会社名</td>
                      <td className="py-3 text-gray-900">{companyData.name}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold">会社名（フリガナ）</td>
                      <td className="py-3 text-gray-900">{companyData.nameFurigana}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold">代表者</td>
                      <td className="py-3 text-gray-900">{companyData.representativeName}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold">設立日</td>
                      <td className="py-3 text-gray-900">{companyData.establishmentDate}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold">資本金</td>
                      <td className="py-3 text-gray-900">{companyData.capital.toLocaleString()}円</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold">決算月</td>
                      <td className="py-3 text-gray-900">{companyData.accountClosingMonth}月</td>
                    </tr>
                    {companyData.businessDescription && (
                      <tr className="border-b border-gray-300">
                        <td className="py-3 text-gray-700 font-bold">事業内容</td>
                        <td className="py-3 text-gray-900">{companyData.businessDescription}</td>
                      </tr>
                    )}
                    {companyData.officeAddress && (
                      <tr className="border-b border-gray-300">
                        <td className="py-3 text-gray-700 font-bold">事業所</td>
                        <td className="py-3 text-gray-900">{companyData.officeAddress}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">企業情報が登録されていません</p>
                  <button
                    onClick={() => router.push("/mypage/edit")}
                    className="px-6 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800"
                  >
                    企業情報を登録
                  </button>
                </div>
              )}
            </section>

            {/* 担当者情報 */}
            <section className="bg-gray-50 border-2 border-gray-300 p-6">
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-300">
                <h2 className="text-lg font-bold text-gray-900">担当者情報</h2>
                <button
                  onClick={() => router.push("/mypage/edit-profile")}
                  className="px-4 py-2 bg-blue-700 text-white rounded text-sm font-bold hover:bg-blue-800"
                >
                  編集
                </button>
              </div>
              {userData ? (
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold w-48">氏名</td>
                      <td className="py-3 text-gray-900">{userData.name || "未設定"}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold">メールアドレス</td>
                      <td className="py-3 text-gray-900">{userData.email}</td>
                    </tr>
                    <tr className="border-b border-gray-300">
                      <td className="py-3 text-gray-700 font-bold">電話番号</td>
                      <td className="py-3 text-gray-900">{userData.phone || "未設定"}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">担当者情報が登録されていません</p>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
