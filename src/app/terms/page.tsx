import Link from "next/link";
import TopHeader from "@/components/TopHeader";

export const metadata = {
  title: "利用規約 | 電子決算公告ドットコム",
  description: "電子決算公告ドットコムの利用規約です。",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-blue-700">
          利用規約
        </h1>
        <p className="text-sm text-gray-500 mb-8">最終更新日：2026年2月27日</p>

        <div className="space-y-8 text-gray-800 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第1条（適用）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>本規約は、電子決算公告ドットコム運営事務局（以下「当社」といいます。）がこのウェブサイト上で提供するサービス（以下「本サービス」といいます。）の利用条件を定めるものです。</li>
              <li>登録ユーザーの皆さま（以下「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第2条（利用登録）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこの承認を登録希望者に通知することによって、利用登録が完了するものとします。</li>
              <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当社が利用登録を相当でないと判断した場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第3条（ユーザーIDおよびパスワードの管理）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
              <li>ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
              <li>ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第4条（利用料金および支払方法）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>ユーザーは、本サービスの有料部分の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。</li>
              <li>利用料金の支払いはクレジットカード決済により行われます。</li>
              <li>ユーザーが利用料金の支払いを遅滞した場合には、ユーザーは年14.6％の割合による遅延損害金を支払うものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第5条（禁止事項）</h2>
            <p className="text-sm mb-2">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>当社のサービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第6条（本サービスの提供の停止等）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                  <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                  <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                  <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                </ul>
              </li>
              <li>当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第7条（退会）</h2>
            <p className="text-sm">ユーザーは、当社の定める退会手続により、本サービスから退会できるものとします。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第8条（保証の否認および免責事項）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。</li>
              <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第9条（サービス内容の変更等）</h2>
            <p className="text-sm">当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第10条（利用規約の変更）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>当社は以下の場合には、ユーザーの個別の同意を要せず、本規約を変更することができるものとします。
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>本規約の変更がユーザーの一般の利益に適合するとき。</li>
                  <li>本規約の変更が本サービス利用契約の目的に反せず、かつ、変更の必要性、変更後の内容の相当性その他の変更に係る事情に照らして合理的なものであるとき。</li>
                </ul>
              </li>
              <li>当社はユーザーに対し、前項による本規約の変更にあたり、事前に、本規約を変更する旨、変更後の本規約の内容およびその効力発生時期を通知します。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第11条（個人情報の取り扱い）</h2>
            <p className="text-sm">当社は、本サービスの利用によって取得する個人情報については、当社「<Link href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</Link>」に従い適切に取り扱うものとします。</p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-3 text-blue-900">第12条（準拠法・裁判管轄）</h2>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスに関して紛争が生じた場合には、東京地方裁判所を専属的合意管轄とします。</li>
            </ol>
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
