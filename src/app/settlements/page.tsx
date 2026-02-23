"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";

export default function SettlementsPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      
      try {
        const q = query(collection(db, "companies"));
        const snap = await getDocs(q);
        setCompanies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">電子決算公告一覧</h1>
        {loading ? (
          <p>読み込み中...</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-600">登録されている会社がありません。</p>
        ) : (
          <div className="grid gap-4">
            {companies.map(company => (
              <div key={company.id} className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2">{company.name}</h2>
                <p className="text-gray-600">{company.nameFurigana}</p>
                <p className="text-sm text-gray-500 mt-2">
                  業種: {company.businessDescription || "未設定"}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
