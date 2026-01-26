export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">電子決算公告システム</h1>
        <div className="space-y-6">
          <p className="text-lg">
            決算公告を電子的に公開・管理するためのプラットフォームです。
          </p>
          <div className="flex gap-4">
            <a
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ログイン
            </a>
            <a
              href="/signup"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              新規登録
            </a>
            <a
              href="/settlements"
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              公開企業一覧
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
