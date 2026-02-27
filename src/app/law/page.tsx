import Link from "next/link";
import TopHeader from "@/components/TopHeader";

export const metadata = {
  title: "特定商取引法に基づく表記 | 電子決算公告ドットコム",
  description: "電子決算公告ドットコムの特定商取引法に基づく表記です。",
};

export default function LawPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-blue-700">
          特定商取引法に基づく表記
        </h1>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  販売事業者名
                </th>
                <td className="px-6 py-4 text-gray-800">
                  {/* TODO: 実際の事業者名に差し替えてください */}
                  電子決算公告ドットコム運営事務局
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  代表者名
                </th>
                <td className="px-6 py-4 text-gray-800">
                  {/* TODO: 実際の代表者名に差し替えてください */}
                  ○○ ○○
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  所在地
                </th>
                <td className="px-6 py-4 text-gray-800">
                  {/* TODO: 実際の所在地に差し替えてください */}
                  〒000-0000<br />
                  東京都○○区○○ 0-0-0
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  電話番号
                </th>
                <td className="px-6 py-4 text-gray-800">
                  {/* TODO: 実際の電話番号に差し替えてください */}
                  00-0000-0000<br />
                  <span className="text-gray-500 text-xs">※お問い合わせはメールにてお願いいたします</span>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  メールアドレス
                </th>
                <td className="px-6 py-4 text-gray-800">
                  {/* TODO: 実際のメールアドレスに差し替えてください */}
                  info@denshi-kessan-koukoku.com
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  サービスURL
                </th>
                <td className="px-6 py-4 text-gray-800">
                  <a href="https://denshi-kessan-koukoku.com" className="text-blue-600 hover:underline">
                    https://denshi-kessan-koukoku.com
                  </a>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  販売価格
                </th>
                <td className="px-6 py-4 text-gray-800">
                  <ul className="space-y-1">
                    <li>1年プラン（自動更新）：3,960円（税込）/ 年</li>
                    <li>5年プラン（一括払い）：15,400円（税込）</li>
                    <li>10年プラン（一括払い）：22,000円（税込）</li>
                  </ul>
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  販売価格以外の必要料金
                </th>
                <td className="px-6 py-4 text-gray-800">
                  なし（消費税込みの価格です）
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  支払方法
                </th>
                <td className="px-6 py-4 text-gray-800">
                  クレジットカード決済（VISA / Mastercard / JCB / American Express / Diners Club）
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  支払時期
                </th>
                <td className="px-6 py-4 text-gray-800">
                  サービス申込時に即時決済されます。<br />
                  1年プラン（自動更新）の場合、次回以降は契約期間の更新日に自動決済されます。
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  サービスの提供時期
                </th>
                <td className="px-6 py-4 text-gray-800">
                  決済完了後、即時ご利用いただけます。
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  キャンセル・解約について
                </th>
                <td className="px-6 py-4 text-gray-800">
                  <ul className="space-y-2">
                    <li>
                      <strong>1年プラン（自動更新）：</strong>マイページからいつでも自動更新を停止できます。停止した場合、次回更新日以降はサービスが利用できなくなります。契約途中での返金は原則として行いません。
                    </li>
                    <li>
                      <strong>5年・10年プラン（一括払い）：</strong>一括払いのため、契約途中での返金は原則として行いません。サービスは契約期間満了まで継続してご利用いただけます。
                    </li>
                  </ul>
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-900 w-1/3 align-top">
                  動作環境
                </th>
                <td className="px-6 py-4 text-gray-800">
                  <p>インターネット接続環境および以下のブラウザが必要です。</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                    <li>Google Chrome（最新版）</li>
                    <li>Safari（最新版）</li>
                    <li>Firefox（最新版）</li>
                    <li>Microsoft Edge（最新版）</li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            ← トップページに戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
