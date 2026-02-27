"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

interface ProfileData {
  name: string;
  phone: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    phone: "",
  });

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadProfileData(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadProfileData = async (currentUser: User) => {
    if (!db) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setFormData({
          name: userData.name || "",
          phone: userData.phone || "",
        });
      }
    } catch (error) {
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!db || !user) {
      setMessage({ type: "error", text: "認証エラーが発生しました" });
      return;
    }

    if (!formData.name) {
      setMessage({ type: "error", text: "氏名を入力してください" });
      return;
    }

    setLoading(true);

    try {
      const userDocRef = doc(db, "users", user.uid);
      const existingDoc = await getDoc(userDocRef);

      const profileData = {
        uid: user.uid,
        email: user.email || "",
        name: formData.name,
        phone: formData.phone,
        active: true,
        updatedAt: Timestamp.now(),
      };

      if (existingDoc.exists()) {
        // 既存データを保持しながら更新
        await setDoc(userDocRef, {
          ...existingDoc.data(),
          ...profileData,
        });
      } else {
        // 新規作成
        await setDoc(userDocRef, {
          ...profileData,
          createdAt: Timestamp.now(),
        });
      }

      setMessage({ type: "success", text: "担当者情報を更新しました。マイページに戻ります..." });
      setTimeout(() => {
        router.push("/mypage");
      }, 2000);
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
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => router.push("/mypage")}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← マイページに戻る
              </button>
            </div>

            <h1 className="text-3xl font-bold mb-8">担当者情報の編集</h1>

            <div className="bg-white p-8 rounded-lg shadow">
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
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={user?.email || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">メールアドレスは変更できません</p>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    氏名 <span className="text-red-500">必須</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="山田 太郎"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="090-1234-5678"
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/mypage")}
                    disabled={loading}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-400 disabled:bg-gray-200 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? "保存中..." : "更新"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
