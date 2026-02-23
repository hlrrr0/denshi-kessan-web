"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/payjp";

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
      console.log("Loading user data for:", currentUser.uid);
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userDoc = userDocSnap.data();
        console.log("User data loaded:", userDoc);
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
          console.log("Subscription data loaded:", subscription);
          setSubscriptionData({
            subscriptionPlanId: subscription.subscriptionPlanId || "",
            active: subscription.active || false,
            expirationDate: subscription.expirationDate,
            automaticRenewalFlag: subscription.automaticRenewalFlag || false,
            createdAt: subscription.createdAt,
            payjpSubscriptionId: subscription.payjpSubscriptionId || "",
          });
        } else {
          console.log("No subscription data found");
        }
      } else {
        console.log("User document not found, using Auth data");
        // Firestoreにデータがない場合、Authの情報を使用
        setUserData({
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          phone: "",
        });
      }

      // 会社情報を取得
      console.log("Loading company data...");
      const companiesRef = collection(db, "companies");
      const companyQuery = query(companiesRef, where("userId", "==", currentUser.uid));
      const companySnapshot = await getDocs(companyQuery);
      console.log("Company query result:", companySnapshot.size, "documents");

      if (!companySnapshot.empty) {
        const companyDoc = companySnapshot.docs[0];
        const data = companyDoc.data();
        console.log("Company data loaded:", data);
        setCompanyData({
          id: companyDoc.id,
          name: data.name || "",
          nameFurigana: data.nameFurigana || "",
          establishmentDate: data.establishmentDate || "",
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
        console.log("Loading notices for company:", companyDoc.id);
        const noticesRef = collection(db, "companies", companyDoc.id, "notices");
        const noticesSnapshot = await getDocs(noticesRef);
        console.log("Notices query result:", noticesSnapshot.size, "documents");
        const noticesData = noticesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as NoticeData[];
        setNotices(noticesData);
      } else {
        console.log("No company data found");
      }
    } catch (error: any) {
      console.error("Error loading user data:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
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
          <h1 className="text-3xl font-bold mb-8">マイページ</h1>

          <div className="space-y-6">
            {/* 担当者情報 */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">担当者情報</h2>
                <button
                  onClick={() => router.push("/mypage/edit-profile")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  編集
                </button>
              </div>
              {userData ? (
                <div className="space-y-3">
                  <div className="flex border-b pb-2">
                    <span className="w-32 text-gray-600">氏名</span>
                    <span className="font-medium">{userData.name || "未設定"}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-32 text-gray-600">メールアドレス</span>
                    <span className="font-medium">{userData.email}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-32 text-gray-600">電話番号</span>
                    <span className="font-medium">{userData.phone || "未設定"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">担当者情報が登録されていません</p>
              )}
            </section>

            {/* サブスクリプション・決済情報 */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">サブスクリプション・決済情報</h2>
                <button
                  onClick={() => router.push("/mypage/subscription")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  プラン変更
                </button>
              </div>
              {subscriptionData && subscriptionData.active ? (
                <div className="space-y-4">
                  {/* 現在のプラン */}
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">現在のプラン</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        subscriptionData.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {subscriptionData.active ? "有効" : "無効"}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl font-bold text-blue-900">
                        {SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.subscriptionPlanId)?.name || "不明"}
                      </span>
                      <span className="text-lg font-semibold text-blue-700">
                        {formatPrice(SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.subscriptionPlanId)?.price || 0)}
                      </span>
                    </div>
                  </div>

                  {/* 有効期限 */}
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">有効期限</span>
                    <span className="font-medium">
                      {subscriptionData.expirationDate?.toDate?.()?.toLocaleDateString() || "不明"}
                    </span>
                  </div>

                  {/* 自動更新 */}
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">決済タイプ</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        subscriptionData.automaticRenewalFlag 
                          ? "bg-blue-100 text-blue-700" 
                          : "bg-green-100 text-green-700"
                      }`}>
                        {subscriptionData.automaticRenewalFlag ? "定期課金（自動更新）" : "一括払い"}
                      </span>
                      {subscriptionData.automaticRenewalFlag && (
                        <button
                          onClick={() => router.push("/mypage/subscription/cancel")}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          キャンセル
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 登録済みカード情報 */}
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">クレジットカード</span>
                    <div className="flex-1 flex justify-between items-center">
                      <span className="font-medium">
                        {userData?.payjpCardId ? "登録済み" : "未登録"}
                      </span>
                      <button
                        onClick={() => router.push("/mypage/payment")}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {userData?.payjpCardId ? "カード変更" : "カード登録"}
                      </button>
                    </div>
                  </div>

                  {/* 決済履歴リンク */}
                  <div className="pt-2">
                    <button
                      onClick={() => router.push("/mypage/billing-history")}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      決済履歴を表示 →
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">サブスクリプションプランに登録していません</p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-3">プラン一覧</h3>
                    <div className="space-y-3">
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <div key={plan.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <span className="font-medium">{plan.name}</span>
                            <p className="text-sm text-gray-500">{plan.description}</p>
                          </div>
                          <span className="font-semibold text-blue-600">{formatPrice(plan.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/mypage/subscription")}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 w-full"
                  >
                    プランに登録する
                  </button>
                </div>
              )}
            </section>

            {/* 登録企業情報 */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">登録企業情報</h2>
                <button
                  onClick={() => router.push("/mypage/edit")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  編集
                </button>
              </div>
              {companyData ? (
                <div className="space-y-3">
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">会社名</span>
                    <span className="font-medium">{companyData.name}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">会社名（フリガナ）</span>
                    <span className="font-medium">{companyData.nameFurigana}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">代表者</span>
                    <span className="font-medium">{companyData.representativeName}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">設立日</span>
                    <span className="font-medium">{companyData.establishmentDate}</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">資本金</span>
                    <span className="font-medium">{companyData.capital.toLocaleString()}円</span>
                  </div>
                  <div className="flex border-b pb-2">
                    <span className="w-40 text-gray-600">決算月</span>
                    <span className="font-medium">{companyData.accountClosingMonth}月</span>
                  </div>
                  {companyData.businessDescription && (
                    <div className="flex border-b pb-2">
                      <span className="w-40 text-gray-600">事業内容</span>
                      <span className="font-medium">{companyData.businessDescription}</span>
                    </div>
                  )}
                  {companyData.officeAddress && (
                    <div className="flex border-b pb-2">
                      <span className="w-40 text-gray-600">事業所</span>
                      <span className="font-medium">{companyData.officeAddress}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">企業情報が登録されていません</p>
                  <button
                    onClick={() => router.push("/mypage/edit")}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    企業情報を登録
                  </button>
                </div>
              )}
            </section>

            {/* アップロード済みファイル一覧 */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">アップロード済みファイル一覧</h2>
                <button
                  onClick={() => router.push("/mypage/upload")}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium"
                >
                  + 新規アップロード
                </button>
              </div>
              {notices.length > 0 ? (
                <div className="space-y-3">
                  {notices.map((notice) => (
                    <div key={notice.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex-1">
                        <h3 className="font-medium">{notice.title}</h3>
                        <p className="text-sm text-gray-500">
                          {notice.createdAt?.toDate?.()?.toLocaleDateString() || "日付不明"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={notice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          表示
                        </a>
                        <button
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">アップロード済みのファイルはありません</p>
                  <button
                    onClick={() => router.push("/mypage/upload")}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700"
                  >
                    決算公告をアップロード
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
