"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collectionGroup, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";

export default function SettlementsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!db) {
        setLoading(false);
        return;
      }
      
      try {
        // まずサブスクリプションが有効な企業を取得（collectionGroupで全ユーザーのcompany_informationを検索）
        const now = Timestamp.now();
        try {
          const q = query(
            collectionGroup(db, "company_information"),
            where("subscriptionActive", "==", true),
            where("subscriptionExpiresAt", ">", now)
          );
          const snap = await getDocs(q);
          const activeCompanies = snap.docs.map(doc => {
            // パスからuserIdを取得: users/{userId}/company_information/{docId}
            const userId = doc.ref.parent.parent?.id || "";
            return { 
              id: doc.id, 
              userId,
              ...doc.data() 
            };
          });
          
          if (activeCompanies.length > 0) {
            setCompanies(activeCompanies);
            setLoading(false);
            return;
          }
        } catch (indexError) {
          // collectionGroupインデックスが未作成の場合のフォールバック
          // 全企業を取得し、クライアント側でサブスクリプション有効のもののみフィルタリング
          console.warn("collectionGroup query failed (index may be missing), falling back to client-side filter:", indexError);
          
          const allSnap = await getDocs(collectionGroup(db, "company_information"));
          const now = new Date();
          const activeCompanies = allSnap.docs
            .map(doc => {
              const userId = doc.ref.parent.parent?.id || "";
              return { 
                id: doc.id, 
                userId,
                ...doc.data() 
              } as any;
            })
            .filter((company: any) => {
              // 課金済みかつ有効期限内のもののみ表示
              if (!company.subscriptionActive) return false;
              const expiresAt = company.subscriptionExpiresAt;
              if (!expiresAt) return false;
              const expirationDate = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
              return expirationDate > now;
            });
          
          setCompanies(activeCompanies);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-16">
        {/* ヘッダーセクション */}
        <div className="mb-12 pb-6 border-b-2 border-gray-300">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            電子決算公告一覧
          </h1>
          <p className="text-lg text-gray-700">
            公開されている企業の決算公告を閲覧できます
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-700 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">読み込み中...</p>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded border-2 border-gray-300">
            <div className="w-24 h-24 bg-white rounded border-2 border-gray-300 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">登録されている企業がありません</h2>
            <p className="text-gray-700">まだ決算公告が公開されている企業はありません</p>
          </div>
        ) : (
          <>
            {/* 統計情報 */}
            <div className="mb-8">
              <div className="inline-flex items-center bg-gray-50 rounded border-2 border-gray-300 px-6 py-3">
                <svg className="w-5 h-5 text-blue-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-gray-700 font-medium">登録企業数:</span>
                <span className="ml-2 text-2xl font-bold text-blue-700">{companies.length}</span>
                <span className="ml-1 text-gray-700">社</span>
              </div>
            </div>

            {/* 企業カード一覧 */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map(company => (
                <div
                  key={company.id}
                  className="group bg-white rounded border-2 border-gray-300 hover:border-blue-700 transition-all overflow-hidden cursor-pointer"
                  onClick={() => router.push(`/settlements/${company.userId}/${company.id}`)}
                >
                  {/* カードヘッダー */}
                  <div className="bg-blue-700 p-6 group-hover:bg-blue-800 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                        <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <svg className="w-6 h-6 text-white/80 group-hover:text-white transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1 line-clamp-2 min-h-[3.5rem]">
                      {company.name}
                    </h2>
                    <p className="text-white/80 text-sm line-clamp-1">
                      {company.nameFurigana}
                    </p>
                  </div>

                  {/* カードコンテンツ */}
                  <div className="p-6 space-y-3">
                    {company.representativeName && (
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 mb-0.5">代表者</div>
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {company.representativeName}
                          </div>
                        </div>
                      </div>
                    )}

                    {company.businessDescription && (
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 mb-0.5">事業内容</div>
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {company.businessDescription}
                          </div>
                        </div>
                      </div>
                    )}

                    {company.officeAddress && (
                      <div className="flex items-start">
                        <div className="w-5 h-5 text-blue-700 mr-2 flex-shrink-0 mt-0.5">
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-600 mb-0.5">所在地</div>
                          <div className="text-sm text-gray-700 line-clamp-2">
                            {company.officeAddress}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 統計情報 */}
                    <div className="pt-3 border-t border-gray-300 flex gap-2 flex-wrap">
                      {company.capital > 0 && (
                        <div className="inline-flex items-center bg-gray-100 rounded px-3 py-1.5 border border-gray-300">
                          <span className="text-xs text-gray-700">資本金</span>
                          <span className="ml-1.5 text-sm font-bold text-gray-900">
                            {(company.capital / 10000).toLocaleString()}万円
                          </span>
                        </div>
                      )}
                      {company.numberOfEmployees > 0 && (
                        <div className="inline-flex items-center bg-gray-100 rounded px-3 py-1.5 border border-gray-300">
                          <span className="text-xs text-gray-700">従業員</span>
                          <span className="ml-1.5 text-sm font-bold text-gray-900">
                            {company.numberOfEmployees}人
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* カードフッター */}
                  <div className="px-6 pb-6">
                    <div className="bg-gray-50 rounded border-2 border-gray-300 px-4 py-3 flex items-center justify-between group-hover:bg-blue-50 group-hover:border-blue-700 transition-all">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        詳細を見る
                      </span>
                      <svg className="w-5 h-5 text-gray-900 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
