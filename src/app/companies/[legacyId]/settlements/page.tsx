"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collectionGroup, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SettlementDetail from "@/components/SettlementDetail";
import Header from "@/components/Header";

/**
 * 旧URL形式との互換性を保つためのページ
 * 旧URL: /companies/{user.uuid}/settlements
 * 
 * 登記で使用されているURLのため、変更・リダイレクト不可
 * このURLで直接コンテンツを表示する必要があります
 * 
 * legacyId = 旧usersテーブルのuuid（現在はusers/{uid}のlegacyUuidフィールド）
 */
export default function LegacyCompanySettlementsPage() {
  const params = useParams();
  const legacyId = params.legacyId as string;
  const [ids, setIds] = useState<{ userId: string; companyId: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const findCompany = async () => {
      if (!db || !legacyId) {
        setError(true);
        setLoading(false);
        return;
      }

      try {
        // company_informationからlegacyUuidで検索
        const companiesQuery = query(
          collectionGroup(db, "company_information"),
          where("legacyUuid", "==", legacyId),
          limit(1)
        );
        
        const companiesSnap = await getDocs(companiesQuery);

        if (!companiesSnap.empty) {
          const companyDoc = companiesSnap.docs[0];
          const companyId = companyDoc.id;
          // パスからuserIdを取得: users/{userId}/company_information/{docId}
          const userId = companyDoc.ref.parent.parent?.id || "";
          
          if (userId) {
            setIds({ userId, companyId });
          } else {
            console.warn(`Could not extract userId from company path for legacyUuid ${legacyId}`);
            setError(true);
          }
        } else {
          console.warn(`Company with legacyUuid ${legacyId} not found`);
          setError(true);
        }
      } catch (error) {
        console.error("Error finding company:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    findCompany();
  }, [legacyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !ids) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">会社が見つかりません</h1>
            <p className="text-gray-700 mb-8">指定された企業情報は存在しないか、削除された可能性があります。</p>
          </div>
        </main>
      </div>
    );
  }

  return <SettlementDetail userId={ids.userId} companyId={ids.companyId} />;
}
