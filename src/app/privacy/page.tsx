import Link from "next/link";
import TopHeader from "@/components/TopHeader";

export const metadata = {
  title: "プライバシーポリシー | 電子決算公告ドットコム",
  description: "電子決算公告ドットコムのプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-blue-700">
          プライバシーポリシー
        </h1>
        <p className="text-sm text-gray-500 mb-8">最終更新日：2026年2月27日</p>

        <div className="space-y-8 text-gray-800 leading-relaxed">
          <section>
            <p className="text-sm">
              電子決算公告ドットコム運営事務局（以下「当社」といいます。）は、本ウェブサイト上で提供するサービス（以下「本サービス」といいます。）における、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第1条（個人情報）</h2>
            <p className="text-sm">
              「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報（個人識別情報）を指します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第2条（個人情報の収集方法）</h2>
            <p className="text-sm mb-2">当社は、ユーザーが利用登録をする際に以下の個人情報をお聞きすることがあります。</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li>氏名</li>
              <li>メールアドレス</li>
              <li>電話番号</li>
              <li>住所</li>
              <li>会社名・法人情報</li>
              <li>クレジットカード情報（Pay.jp経由で安全に処理。当社はカード番号を保持しません）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第3条（個人情報を収集・利用する目的）</h2>
            <p className="text-sm mb-2">当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>本サービスの提供・運営のため</li>
              <li>ユーザーからのお問い合わせに回答するため</li>
              <li>ユーザーに対して利用料金を請求するため</li>
              <li>メンテナンス、重要なお知らせなど必要に応じた連絡のため</li>
              <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
              <li>ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
              <li>上記の利用目的に付随する目的</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第4条（利用目的の変更）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。</li>
              <li>利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第5条（個人情報の第三者提供）</h2>
            <p className="text-sm mb-2">
              当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第6条（個人情報の安全管理）</h2>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              <li>クレジットカード情報は、PCI DSS準拠の決済代行サービス（PAY.JP）を通じて安全に処理され、当社のサーバーにはカード番号を保存しません。</li>
              <li>通信は全てSSL/TLSにより暗号化されています。</li>
              <li>ユーザーデータはGoogle Cloud（Firebase）上で安全に管理されています。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第7条（個人情報の開示）</h2>
            <p className="text-sm">
              当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第8条（個人情報の訂正および削除）</h2>
            <p className="text-sm">
              ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下「訂正等」といいます。）を請求することができます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第9条（Cookie等の利用）</h2>
            <p className="text-sm">
              本サービスでは、ユーザー認証およびセキュリティ（reCAPTCHA）のためにCookieおよび類似技術を使用しています。ユーザーはブラウザの設定によりCookieの受け入れを拒否することができますが、その場合、本サービスの一部が利用できなくなることがあります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第10条（プライバシーポリシーの変更）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。</li>
              <li>当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第11条（お問い合わせ窓口）</h2>
            <p className="text-sm">
              本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
            </p>
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4 text-sm">
              <p>電子決算公告ドットコム運営事務局</p>
              {/* TODO: 実際の連絡先に差し替えてください */}
              <p>メールアドレス：info@denshi-kessan-koukoku.com</p>
            </div>
          </section>
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
