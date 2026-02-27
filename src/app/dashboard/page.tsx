"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

interface CompanyData {
  name: string;
  nameFurigana: string;
  establishmentDate: string;
  representativeName: string;
  capital: string;
  amountOfSales: string;
  numberOfEmployees: string;
  businessDescription: string;
  officeAddress: string;
  officialHomepageUrl: string;
  accountClosingMonth: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState<CompanyData>({
    name: "",
    nameFurigana: "",
    establishmentDate: "",
    representativeName: "",
    capital: "",
    amountOfSales: "",
    numberOfEmployees: "",
    businessDescription: "",
    officeAddress: "",
    officialHomepageUrl: "",
    accountClosingMonth: "",
  });

  // ユーザー認証と既存データの読み込み
  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // 既存の会社情報を取得
        await loadCompanyData(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadCompanyData = async (uid: string) => {
    if (!db) return;

    try {
      // ユーザーが登録した会社情報を取得
      const companiesRef = collection(db, "users", uid, "company_information");
      const querySnapshot = await getDocs(companiesRef);

      if (!querySnapshot.empty) {
        const companyDoc = querySnapshot.docs[0];
        const data = companyDoc.data();
        setCompanyId(companyDoc.id);

        setFormData({
          name: data.name || "",
          nameFurigana: data.nameFurigana || "",
          establishmentDate: data.establishmentDate?.toDate ? data.establishmentDate.toDate().toISOString().split("T")[0] : (data.establishmentDate || ""),
          representativeName: data.representativeName || "",
          capital: data.capital?.toString() || "",
          amountOfSales: data.amountOfSales?.toString() || "",
          numberOfEmployees: data.numberOfEmployees?.toString() || "",
          businessDescription: data.businessDescription || "",
          officeAddress: data.officeAddress || "",
          officialHomepageUrl: data.officialHomepageUrl || "",
          accountClosingMonth: data.accountClosingMonth?.toString() || "",
        });
      }
    } catch (error) {
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!db || !userId) {
      setMessage({ type: "error", text: "認証エラーが発生しました" });
      return;
    }

    // 必須フィールドのバリデーション
    if (!formData.name || !formData.nameFurigana || !formData.establishmentDate || 
        !formData.representativeName || !formData.capital || !formData.accountClosingMonth) {
      setMessage({ type: "error", text: "必須項目を入力してください" });
      return;
    }

    setLoading(true);

    try {
      const companyData = {
        userId,
        name: formData.name,
        nameFurigana: formData.nameFurigana,
        establishmentDate: formData.establishmentDate,
        representativeName: formData.representativeName,
        capital: parseFloat(formData.capital) || 0,
        amountOfSales: parseFloat(formData.amountOfSales) || 0,
        numberOfEmployees: parseInt(formData.numberOfEmployees) || 0,
        businessDescription: formData.businessDescription,
        officeAddress: formData.officeAddress,
        officialHomepageUrl: formData.officialHomepageUrl,
        accountClosingMonth: parseInt(formData.accountClosingMonth) || 1,
        updatedAt: Timestamp.now(),
      };

      if (companyId) {
        // 更新
        await setDoc(doc(db, "users", userId, "company_information", companyId), companyData);
        setMessage({ type: "success", text: "会社情報を更新しました。ダッシュボードを再読み込みします..." });
        
        // 2秒後にページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // 新規登録
        const newCompanyRef = doc(collection(db, "users", userId, "company_information"));
        await setDoc(newCompanyRef, {
          ...companyData,
          createdAt: Timestamp.now(),
        });
        setCompanyId(newCompanyRef.id);
        setMessage({ type: "success", text: "会社情報を登録しました。ダッシュボードを再読み込みします..." });
        
        // 2秒後にページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "保存に失敗しました: " + (error.message || "不明なエラー") });
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
          
          <div className="bg-white p-8 rounded-lg shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">企業情報</h2>

            {message && (
              <div className={`mb-6 p-4 rounded ${
                message.type === "success" 
                  ? "bg-green-100 border border-green-400 text-green-700" 
                  : "bg-red-100 border border-red-400 text-red-700"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 会社名 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  会社名 <span className="text-red-500">必須</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="合同会社XIAMI"
                  required
                  disabled={loading}
                />
              </div>

              {/* 会社名（フリガナ） */}
              <div>
                <label htmlFor="nameFurigana" className="block text-sm font-medium mb-2">
                  会社名（フリガナ） <span className="text-red-500">必須</span>
                </label>
                <input
                  type="text"
                  id="nameFurigana"
                  name="nameFurigana"
                  value={formData.nameFurigana}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ド）シャミ"
                  required
                  disabled={loading}
                />
              </div>

              {/* 設立日 */}
              <div>
                <label htmlFor="establishmentDate" className="block text-sm font-medium mb-2">
                  設立（年/月/日） <span className="text-red-500">必須</span>
                </label>
                <input
                  type="date"
                  id="establishmentDate"
                  name="establishmentDate"
                  value={formData.establishmentDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>

              {/* 代表者 */}
              <div>
                <label htmlFor="representativeName" className="block text-sm font-medium mb-2">
                  代表者 <span className="text-red-500">必須</span>
                </label>
                <input
                  type="text"
                  id="representativeName"
                  name="representativeName"
                  value={formData.representativeName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="今井 大貴"
                  required
                  disabled={loading}
                />
              </div>

              {/* 資本金 */}
              <div>
                <label htmlFor="capital" className="block text-sm font-medium mb-2">
                  資本金 <span className="text-red-500">必須</span>
                </label>
                <input
                  type="text"
                  id="capital"
                  name="capital"
                  value={formData.capital}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10万"
                  required
                  disabled={loading}
                />
              </div>

              {/* 売上高 */}
              <div>
                <label htmlFor="amountOfSales" className="block text-sm font-medium mb-2">
                  売上高
                </label>
                <input
                  type="text"
                  id="amountOfSales"
                  name="amountOfSales"
                  value={formData.amountOfSales}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100万"
                  disabled={loading}
                />
              </div>

              {/* 従業員数 */}
              <div>
                <label htmlFor="numberOfEmployees" className="block text-sm font-medium mb-2">
                  従業員数
                </label>
                <input
                  type="text"
                  id="numberOfEmployees"
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1人"
                  disabled={loading}
                />
              </div>

              {/* 事業内容 */}
              <div>
                <label htmlFor="businessDescription" className="block text-sm font-medium mb-2">
                  事業内容
                </label>
                <textarea
                  id="businessDescription"
                  name="businessDescription"
                  value={formData.businessDescription}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Web制作"
                  disabled={loading}
                />
              </div>

              {/* 事業所 */}
              <div>
                <label htmlFor="officeAddress" className="block text-sm font-medium mb-2">
                  事業所
                </label>
                <input
                  type="text"
                  id="officeAddress"
                  name="officeAddress"
                  value={formData.officeAddress}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="東京都渋谷区渋谷3丁目1番3号YAZAWAビル3階"
                  disabled={loading}
                />
              </div>

              {/* 公式ホームページ */}
              <div>
                <label htmlFor="officialHomepageUrl" className="block text-sm font-medium mb-2">
                  公式ホームページ
                </label>
                <input
                  type="url"
                  id="officialHomepageUrl"
                  name="officialHomepageUrl"
                  value={formData.officialHomepageUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://denshi-kessan-koukoku.com"
                  disabled={loading}
                />
              </div>

              {/* 決算月 */}
              <div>
                <label htmlFor="accountClosingMonth" className="block text-sm font-medium mb-2">
                  決算月 <span className="text-red-500">必須</span>
                </label>
                <select
                  id="accountClosingMonth"
                  name="accountClosingMonth"
                  value={formData.accountClosingMonth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                >
                  <option value="">選択してください</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                    <option key={month} value={month}>
                      {month}月
                    </option>
                  ))}
                </select>
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? "保存中..." : companyId ? "更新" : "登録"}
              </button>
            </form>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
