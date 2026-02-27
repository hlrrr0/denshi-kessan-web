"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/Header";

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
  fiscalYear?: string;
}

export default function SettlementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [notices, setNotices] = useState<NoticeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!db || !companyId) {
        setLoading(false);
        return;
      }

      try {
        // 会社情報を取得
        const companyRef = doc(db, "companies", companyId);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) {
          setCompany({
            id: companySnap.id,
            ...companySnap.data()
          } as CompanyData);

          // 決算公告を取得
          const noticesRef = collection(db, "companies", companyId, "notices");
          const noticesQuery = query(noticesRef, orderBy("createdAt", "desc"));
          const noticesSnap = await getDocs(noticesQuery);
          
          const noticesData = noticesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as NoticeData[];
          
          setNotices(noticesData);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

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

  if (!company) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">会社が見つかりません</h1>
            <button
              onClick={() => router.push("/settlements")}
              className="text-blue-700 hover:text-blue-800 font-bold"
            >
              ← 一覧に戻る
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* パンくずリスト */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/settlements")}
              className="inline-flex items-center text-blue-700 hover:text-blue-800 text-sm font-bold transition-colors"
            >
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              電子決算公告一覧に戻る
            </button>
          </div>

          {/* ヘッダーセクション */}
          <div className="bg-blue-700 rounded border-2 border-blue-700 p-8 md:p-12 mb-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="inline-block px-4 py-1 bg-white/20 rounded text-sm font-bold mb-4">
                  企業情報
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  {company.name}
                </h1>
                <p className="text-white/90 text-xl mb-6">{company.nameFurigana}</p>
                
                {company.officialHomepageUrl && (
                  <a 
                    href={company.officialHomepageUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded border-2 border-white transition-all font-bold"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    公式サイトを見る
                  </a>
                )}
              </div>
              
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/20 rounded border-2 border-white/40 flex items-center justify-center">
                  <svg className="w-16 h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-8">
              {/* 代表者・設立情報 */}
              <div className="bg-white rounded border-2 border-gray-300 p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900 border-b-2 border-gray-300 pb-4">
                  <div className="w-10 h-10 bg-white rounded border-2 border-blue-700 flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  企業概要
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {company.representativeName && (
                    <div className="group">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-700 rounded-full mr-2"></div>
                        代表者
                      </div>
                      <div className="text-lg font-semibold text-gray-900 pl-4">
                        {company.representativeName}
                      </div>
                    </div>
                  )}
                  
                  {company.establishmentDate && (
                    <div className="group">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-700 rounded-full mr-2"></div>
                        設立日
                      </div>
                      <div className="text-lg font-semibold text-gray-900 pl-4">
                        {company.establishmentDate}
                      </div>
                    </div>
                  )}

                  {company.capital > 0 && (
                    <div className="group">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-700 rounded-full mr-2"></div>
                        資本金
                      </div>
                      <div className="text-lg font-semibold text-gray-900 pl-4">
                        {company.capital.toLocaleString()}
                        <span className="text-base text-gray-600 ml-1">円</span>
                      </div>
                    </div>
                  )}

                  {company.accountClosingMonth > 0 && (
                    <div className="group">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-700 rounded-full mr-2"></div>
                        決算月
                      </div>
                      <div className="text-lg font-semibold text-gray-900 pl-4">
                        {company.accountClosingMonth}
                        <span className="text-base text-gray-600 ml-1">月</span>
                      </div>
                    </div>
                  )}

                  {company.numberOfEmployees > 0 && (
                    <div className="group">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-700 rounded-full mr-2"></div>
                        従業員数
                      </div>
                      <div className="text-lg font-semibold text-gray-900 pl-4">
                        {company.numberOfEmployees.toLocaleString()}
                        <span className="text-base text-gray-600 ml-1">人</span>
                      </div>
                    </div>
                  )}

                  {company.amountOfSales > 0 && (
                    <div className="group">
                      <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <div className="w-2 h-2 bg-blue-700 rounded-full mr-2"></div>
                        売上高
                      </div>
                      <div className="text-lg font-semibold text-gray-900 pl-4">
                        {company.amountOfSales.toLocaleString()}
                        <span className="text-base text-gray-600 ml-1">円</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 所在地・事業内容 */}
              {(company.officeAddress || company.businessDescription) && (
                <div className="bg-white rounded border-2 border-gray-300 p-8">
                  {company.officeAddress && (
                    <div className="mb-8 last:mb-0">
                      <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                        <div className="w-8 h-8 bg-white rounded border-2 border-blue-700 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        所在地
                      </h3>
                      <p className="text-gray-900 leading-relaxed pl-11">
                        {company.officeAddress}
                      </p>
                    </div>
                  )}

                  {company.businessDescription && (
                    <div className={company.officeAddress ? "pt-8 border-t-2 border-gray-300" : ""}>
                      <h3 className="text-xl font-bold mb-4 flex items-center text-gray-900">
                        <div className="w-8 h-8 bg-white rounded border-2 border-blue-700 flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        事業内容
                      </h3>
                      <p className="text-gray-900 leading-relaxed whitespace-pre-wrap pl-11">
                        {company.businessDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* 決算公告一覧 */}
          <div className="bg-white rounded border-2 border-gray-300 p-8 md:p-10">
            <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-300">
              <h2 className="text-3xl font-bold flex items-center text-gray-900">
                <div className="w-12 h-12 bg-blue-700 rounded border-2 border-blue-700 flex items-center justify-center mr-4">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                決算公告
              </h2>
              
              {notices.length > 0 && (
                <div className="hidden md:flex items-center text-sm text-gray-700">
                  <span className="font-bold text-blue-700 text-lg mr-1">{notices.length}</span>
                  件の公告
                </div>
              )}
            </div>
            
            {notices.length > 0 ? (
              <div className="space-y-4">
                {notices.map((notice, index) => (
                  <div 
                    key={notice.id} 
                    className="group bg-gray-50 hover:bg-blue-50 border-2 border-gray-300 hover:border-blue-700 rounded p-6 transition-all"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-700 text-white rounded font-bold text-sm">
                            {index + 1}
                          </span>
                          <h3 className="font-bold text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                            {notice.title}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm ml-11">
                          {notice.fiscalYear && (
                            <div className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 mr-1.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">事業年度:</span>
                              <span className="ml-1">{notice.fiscalYear}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-700">
                            <svg className="w-4 h-4 mr-1.5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">公開日:</span>
                            <span className="ml-1">
                              {notice.createdAt?.toDate?.()?.toLocaleDateString("ja-JP", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                              }) || "不明"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <a
                          href={notice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded border-2 border-blue-700 font-bold transition-all"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          PDFを表示
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded border-2 border-gray-300">
                <div className="w-24 h-24 bg-white rounded border-2 border-gray-300 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">決算公告はまだありません</h3>
                <p className="text-gray-700">この企業の決算公告は公開されていません</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
