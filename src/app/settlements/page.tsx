"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
        const q = query(
          collection(db, "subscriptions"),
          where("active", "==", true)
        );
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
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">電子決算公告一覧</h1>
        {loading ? (
          <p>読み込み中...</p>
        ) : (
          <div className="grid gap-4">
            {companies.map(company => (
              <div key={company.id} className="bg-white p-6 rounded-lg shadow">
                <p className="font-medium">{company.id}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
