import Link from "next/link";
import TopHeader from "@/components/TopHeader";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <TopHeader />

      <main>
        {/* ヒーローセクション */}
        <section className="bg-white py-16 border-b border-gray-200">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-block mb-4 px-4 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
              年間3,960円から利用可能
            </div>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">
              電子決算公告ドットコムとは？
            </h2>
            <p className="text-lg text-gray-700 mb-2">
              電子決算公告ドットコムは、
            </p>
            <p className="text-lg text-gray-700 mb-8">
              「<span className="font-bold text-blue-700">決算公告のみに特化した電子公告サービス</span>」です。
            </p>
            <p className="text-base text-gray-600 mb-12">主な特徴は以下の4つ</p>

            {/* ヒーローCTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-10 py-3 bg-blue-700 text-white rounded font-bold text-base hover:bg-blue-800"
              >
                今すぐ無料で始める
              </Link>
              <Link
                href="/settlements"
                className="px-10 py-3 bg-white text-blue-700 border-2 border-blue-700 rounded font-bold text-base hover:bg-blue-50"
              >
                公告一覧を見る
              </Link>
            </div>
          </div>
        </section>

        {/* 4つの特徴 */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-6">
              {/* 特徴1: 業界最安の料金設定 */}
              <div className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xl">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">
                    業界最安の料金設定
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  弊社のサービスは<span className="font-bold">年間3,960円</span>、<span className="font-bold">5年一括払いで15,400円</span>、<span className="font-bold">10年一括払いで22,000円</span>とお手頃価格でご利用いただけます。
                </p>
              </div>

              {/* 特徴2: URL即発行等の便利機能 */}
              <div className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xl">
                    2
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">
                    URL即発行等の便利機能
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  今すぐ会社を設立されたい・手続きを済ませたいという要望に応え、弊社では登録に必要な<span className="font-bold">URLを即発行</span>する仕様にしております。
                </p>
              </div>

              {/* 特徴3: 登録〜決済まで全てがオンライン完結 */}
              <div className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xl">
                    3
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">
                    オンライン完結
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  弊社サービスは<span className="font-bold">全てオンライン</span>での利用が可能で、紙書類を用意して頂く必要がございません。
                </p>
              </div>

              {/* 特徴4: 安心のセキュリティ */}
              <div className="bg-white rounded-lg p-8 border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xl">
                    4
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">
                    安心のセキュリティ
                  </h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  弊社のサーバーは<span className="font-bold">日本政府の基盤システムと同じAWS</span>を採用しており、通信も暗号化されているため、万全のセキュリティ体制が整っております。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 料金プラン */}
        <section className="py-16 bg-white border-y border-gray-200">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold mb-2 text-center text-gray-900">料金プラン</h2>
            <p className="text-gray-600 mb-12 text-center">シンプルで分かりやすい料金体系</p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <div className="bg-white rounded-lg p-8 border-2 border-gray-300">
                <div className="text-gray-700 font-bold mb-2">1年プラン</div>
                <div className="text-4xl font-bold mb-6 text-gray-900">
                  ¥3,960
                  <span className="text-lg font-normal text-gray-600">/年</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">決算公告の掲載</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">URL即時発行</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">無制限PDF保存</span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-3 bg-blue-700 text-white rounded text-center font-bold hover:bg-blue-800"
                >
                  今すぐ始める
                </Link>
              </div>

              <div className="bg-blue-50 rounded-lg p-8 border-2 border-blue-700 relative">
                <div className="absolute -top-3 right-8 bg-red-600 text-white px-3 py-1 rounded text-sm font-bold">
                  おすすめ
                </div>
                <div className="text-blue-700 font-bold mb-2">5年プラン</div>
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  ¥15,400
                  <span className="text-lg font-normal text-gray-600">/5年</span>
                </div>
                <div className="text-sm text-gray-700 mb-6">
                  実質 <span className="font-bold text-xl text-blue-700">¥3,080/年</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">全ての機能を利用可能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">5年間の更新不要</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-bold">¥4,400もお得！</span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-3 bg-blue-700 text-white rounded text-center font-bold hover:bg-blue-800"
                >
                  お得に始める
                </Link>
              </div>

              <div className="bg-white rounded-lg p-8 border-2 border-green-600 relative">
                <div className="absolute -top-3 right-8 bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">
                  最もお得
                </div>
                <div className="text-green-700 font-bold mb-2">10年プラン</div>
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  ¥22,000
                  <span className="text-lg font-normal text-gray-600">/10年</span>
                </div>
                <div className="text-sm text-gray-700 mb-6">
                  実質 <span className="font-bold text-xl text-green-700">¥2,200/年</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">全ての機能を利用可能</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">10年間の更新不要</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 font-bold">¥17,600もお得！</span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="block w-full py-3 bg-green-700 text-white rounded text-center font-bold hover:bg-green-800"
                >
                  最もお得に始める
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTAセクション */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="bg-white rounded-lg p-10 border border-gray-200">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                コストパフォーマンスに優れたプラン
              </h3>
              <p className="text-gray-700 mb-4">
                公告は官報で、決算公告のみ電子公告にされる企業様は、ぜひ弊社の電子決算公告サービスをご利用ください。
              </p>
              <div className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-200">
                <p className="text-base font-bold text-gray-800">
                  公告の方法は<span className="text-blue-700">官報</span>・決算公告のみ<span className="text-blue-700">インターネット決算公告</span>にするのが<br className="hidden md:block" />
                  最もコストパフォーマンスに優れたプランになります。
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/settlements"
                  className="px-10 py-3 bg-white text-blue-700 border-2 border-blue-700 rounded font-bold hover:bg-blue-50"
                >
                  公告をみる
                </Link>
                <Link
                  href="/signup"
                  className="px-10 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800"
                >
                  公告を掲載する
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* サービスについて */}
        <section className="py-16 bg-white border-y border-gray-200">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                サービスについて
              </h2>
              <p className="text-gray-600">簡単3ステップで始められます</p>
            </div>
            
            <div className="space-y-8">
              {/* 登録後の管理画面 */}
              <div className="bg-white rounded-lg p-8 border border-gray-300">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-700 text-white rounded flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">登録後の管理画面</h3>
                    <p className="text-gray-700">登録後の管理画面です。簡単に操作できます。</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-4 mb-6 overflow-hidden">
                  {/* 管理画面モック */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <span className="font-bold text-gray-800 text-sm">アップロード済みファイル一覧</span>
                      <span className="px-3 py-1 bg-green-700 text-white rounded text-xs font-bold">+ 新規アップロード</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                        <div>
                          <p className="text-xs font-bold text-gray-800">第25期 決算公告</p>
                          <p className="text-[10px] text-gray-500">2026/01/15</p>
                        </div>
                        <div className="flex gap-1">
                          <span className="px-2 py-1 border border-blue-700 text-blue-700 text-[10px] font-bold rounded">表示</span>
                          <span className="px-2 py-1 border border-red-600 text-red-600 text-[10px] font-bold rounded">削除</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200">
                        <div>
                          <p className="text-xs font-bold text-gray-800">第24期 決算公告</p>
                          <p className="text-[10px] text-gray-500">2025/01/20</p>
                        </div>
                        <div className="flex gap-1">
                          <span className="px-2 py-1 border border-blue-700 text-blue-700 text-[10px] font-bold rounded">表示</span>
                          <span className="px-2 py-1 border border-red-600 text-red-600 text-[10px] font-bold rounded">削除</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Link href="/signup" className="inline-block px-8 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800">
                    会員登録はこちら
                    <span className="block text-sm font-normal mt-1">会員登録は無料です</span>
                  </Link>
                </div>
              </div>

              {/* 電子決算公告のアップロード */}
              <div className="bg-white rounded-lg p-8 border border-gray-300">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-700 text-white rounded flex items-center justify-center font-bold text-lg">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">PDFアップロード</h3>
                    <p className="text-gray-700">電子決算公告の登録画面です。簡単にアップロードできます。</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded border border-gray-300 p-4 mb-6 overflow-hidden">
                  {/* アップロード画面モック */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="mb-3 pb-2 border-b border-gray-200">
                      <span className="font-bold text-gray-800 text-sm">決算公告のアップロード</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-600 font-medium block mb-1">タイトル</label>
                        <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded text-xs text-gray-700">第26期 決算公告</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 font-medium block mb-1">PDFファイル</label>
                        <div className="w-full px-3 py-2 bg-blue-50 border-2 border-dashed border-blue-400 rounded text-xs text-blue-700 text-center">
                          📄 kessan_26ki.pdf（3.2MB）
                        </div>
                      </div>
                      <div className="pt-1">
                        <span className="w-full block text-center px-4 py-2 bg-blue-700 text-white rounded text-xs font-bold">アップロード</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <Link href="/signup" className="inline-block px-8 py-3 bg-blue-700 text-white rounded font-bold hover:bg-blue-800">
                    会員登録はこちら
                    <span className="block text-sm font-normal mt-1">会員登録は無料です</span>
                  </Link>
                </div>
              </div>

              {/* 料金プラン */}
              <div className="bg-white rounded-lg p-8 border border-gray-300">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-700 text-white rounded flex items-center justify-center font-bold text-lg">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">契約状況の確認</h3>
                    <p className="text-gray-700">管理画面下の契約状況セクションです。簡単に契約可能です。</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-300">
                  <h4 className="font-bold mb-4 text-lg text-gray-900">契約状況</h4>
                  <p className="text-sm text-gray-600 mb-6">電子決算公告ドットコムの契約をしてください。</p>
                  <div className="space-y-4 mb-6">
                    <div className="bg-white rounded-lg p-5 border border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">1年プラン</span>
                        <span className="text-blue-700 font-bold text-lg">年間 ¥3,960 <span className="text-sm text-gray-600">(税込)</span></span>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-5 border-2 border-blue-700 relative">
                      <div className="absolute -top-3 right-4 bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">
                        お得
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">5年プラン</span>
                        <span className="text-blue-700 font-bold text-lg">5年 ¥15,400 <span className="text-sm text-gray-600">(税込)</span></span>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-5 border-2 border-green-600 relative">
                      <div className="absolute -top-3 right-4 bg-green-600 text-white px-3 py-1 rounded text-xs font-bold">
                        最もお得
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-900">10年プラン</span>
                        <span className="text-green-700 font-bold text-lg">10年 ¥22,000 <span className="text-sm text-gray-600">(税込)</span></span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full px-6 py-3 bg-blue-700 text-white rounded hover:bg-blue-800 font-bold">
                    契約状況を確認
                  </button>
                </div>
                <p className="text-gray-700 mb-4 font-medium">契約状況の更新も簡単です。</p>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                  <h4 className="font-bold mb-4 text-lg text-gray-900">契約状況</h4>
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-3 font-bold text-gray-700">契約プラン</td>
                        <td className="py-3 text-gray-900">1年プラン</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-gray-700">有効期限</td>
                        <td className="py-3 text-gray-900">2025-XX-XX(日付)</td>
                      </tr>
                      <tr>
                        <td className="py-3 font-bold text-gray-700">ステータス</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 text-green-600 font-bold">
                            ✓ 契約中です
                          </span>
                          <Link href="#" className="text-blue-700 ml-3 underline hover:text-blue-800">変更する</Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 電子決算公告について */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                電子決算公告について
              </h2>
              <p className="text-gray-600">知っておきたい基礎知識</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-8 border border-gray-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">決算公告とは</h3>
                <p className="leading-relaxed text-gray-700 mb-4">
                  決算公告とは、株式会社が決算報告書である「貸借対照表」と「損益計算書」を公告（公表）することです。
                  決算公告は、<span className="font-bold text-blue-700">会社法440条により義務づけられ</span>、決算公告を怠って株主総会の承認を得てから5年以内に
                  決算公告をしないと、<span className="font-bold text-red-600">100万円以下の過料</span>という罰則が設けられています（会社法976条）。
                  ただし、その前提として、決算の承認を受けることが必要です。そのため、決算公告を行うには株主総会などで
                  決算の承認を受けた後に行うことになります。
                </p>
                <a 
                  href="http://www.moj.go.jp/MINJI/minji06_00082.html" 
                  target="_blank" 
                  rel="noopener"
                  className="text-blue-700 hover:underline font-medium"
                >
                  法務省のホームページ →
                </a>
              </div>

              <div className="bg-white rounded-lg p-8 border border-gray-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">電子公告とは</h3>
                <p className="leading-relaxed text-gray-700 mb-4">
                  電子公告は会社法で認められた公告方法の一つです。電子公告は「電子公告」という、
                  公告の方法は、官報及び定款で定めた時事に関する事項を掲載する日刊新聞紙又は電子公告に
                  掲載することができます（会社法第939条）。
                </p>
                <p className="leading-relaxed text-gray-700 mb-4">
                  電子公告制度は一般的には会社のホームページを利用して行われますが、公告においては信憑性が重要です。
                  そのため、公告の改ざんが行われないように技術的・法的な裏付けが必要です。様々なシステム運用会社が
                  電子公告サービスを提供していますが、各システム運用会社は法務省の登録を受けています。
                </p>
                <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-700">
                  <p className="leading-relaxed text-gray-800">
                    当サービス（電子決算公告ドットコム）は<span className="font-bold text-blue-700">決算公告に特化</span>しています。会社が負担すべき公告手続きにおいて、
                    会社法第440条で定められた決算公告の義務を、<span className="font-bold text-blue-700">最もコストパフォーマンスよく実現</span>させるためのサービスです。
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-8 border border-gray-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">決算公告の公告方法について</h3>
                <p className="leading-relaxed text-gray-700 mb-4">
                  公告の方法として会社法第939条では、一般的には次の3つの方法が認められています。
                </p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3 bg-gray-50 rounded p-4">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-700 text-white rounded flex items-center justify-center text-sm font-bold">1</span>
                    <span className="text-gray-700">官報に掲載する方法</span>
                  </li>
                  <li className="flex items-start gap-3 bg-gray-50 rounded p-4">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-700 text-white rounded flex items-center justify-center text-sm font-bold">2</span>
                    <span className="text-gray-700">時事に関する事項を掲載する日刊新聞紙に掲載する方法</span>
                  </li>
                  <li className="flex items-start gap-3 bg-blue-50 rounded p-4 border-2 border-blue-700">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-700 text-white rounded flex items-center justify-center text-sm font-bold">3</span>
                    <span className="text-gray-700 font-bold">電子公告 ← 当サービス</span>
                  </li>
                </ol>
              </div>

              <div className="bg-white rounded-lg p-8 border border-gray-300">
                <h3 className="text-xl font-bold text-gray-900 mb-4">公告方法の変更</h3>
                <p className="leading-relaxed text-gray-700">
                  一般的な会社が定款で定めている公告の方法は、「官報」と「各種日刊紙」のいずれかです。
                  しかし、公告の方法を「電子公告」に変更することも可能です。変更を行った後５年以内に登記をしないと、
                  新しい公告方法として認められません。
                </p>
              </div>

              <div className="bg-blue-700 rounded-lg p-8 text-white">
                <h3 className="text-xl font-bold mb-4">電子決算特例を適用</h3>
                <p className="leading-relaxed mb-4">
                  電子公告制度のうち「<span className="font-bold">電子公告による決算公告特例</span>」というものがあります（会社法第440条第3項）。
                  たとえ、公告方法を「官報掲載」や「日刊新聞紙掲載」と定款で定めている会社でも、決算公告に限っては
                  「電子公告」で公告することが許されています。つまり、これが決算公告の電子公告特例です。
                </p>
                <div className="bg-blue-800 rounded-lg p-6">
                  <p className="leading-relaxed font-bold">
                    この特例により、すべての会社は定款変更をしなくても決算公告をインターネット上にて公告することができます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 最終CTA */}
        <section className="py-16 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              今すぐ始めましょう
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              会員登録は無料。決算公告を簡単に、そして安く掲載できます。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto mb-12">
              <Link
                href="/signup"
                className="px-10 py-3 bg-blue-700 text-white rounded font-bold text-lg hover:bg-blue-800"
              >
                無料で会員登録
              </Link>
              <Link
                href="/settlements"
                className="px-10 py-3 bg-white text-blue-700 border-2 border-blue-700 rounded font-bold text-lg hover:bg-blue-50"
              >
                公告を見てみる
              </Link>
            </div>
            
            {/* 信頼性の証 */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="font-bold text-gray-900 mb-2">セキュア</h3>
                <p className="text-sm text-gray-600">AWS採用の高セキュリティ</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-bold text-gray-900 mb-2">即時発行</h3>
                <p className="text-sm text-gray-600">登録後すぐにURLを取得</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                <div className="text-4xl mb-3">💰</div>
              <h3 className="font-bold text-gray-900 mb-2">お手頃価格</h3>
              <p className="text-sm text-gray-600">年間3,960円から利用可能</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* フッター */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4">
          {/* メインフッター */}
          <div className="py-12 grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-xl font-bold mb-4 text-white">
                電子決算公告ドットコム
              </h3>
              <p className="text-gray-400 mb-4 leading-relaxed text-sm">
                決算公告のみに特化した電子公告サービス。<br />
                業界最安値で、簡単・安全に決算公告を掲載できます。
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">サービス</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/settlements" className="hover:text-white">公告一覧</Link></li>
                <li><Link href="/signup" className="hover:text-white">新規登録</Link></li>
                <li><Link href="/login" className="hover:text-white">ログイン</Link></li>
                <li><Link href="/mypage" className="hover:text-white">マイページ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">法的情報</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/terms" className="hover:text-white">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link></li>
                <li><Link href="/law" className="hover:text-white">特定商取引法</Link></li>
              </ul>
            </div>
          </div>
          
          {/* コピーライト */}
          <div className="border-t border-gray-700 py-6 text-center">
            <p className="text-gray-400 text-sm">
              &copy; 2026 電子決算公告ドットコム All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
