import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white border-2 border-gray-300 rounded-lg p-8 shadow-sm">
          <h1 className="text-6xl font-bold text-blue-700 mb-4">404</h1>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            ページが見つかりません
          </h2>
          <p className="text-gray-600 mb-6">
            お探しのページは移動または削除された可能性があります。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors text-sm font-medium"
            >
              トップページへ
            </Link>
            <Link
              href="/settlements"
              className="inline-block bg-white text-blue-700 border-2 border-blue-700 px-6 py-2 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              決算公告一覧へ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
