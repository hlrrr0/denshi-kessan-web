import AuthGuard from "@/components/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
          <div className="space-y-8">
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">会社情報登録</h2>
              <p className="text-gray-600">会社情報を登録してください。</p>
            </section>
            <section className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">決算公告アップロード</h2>
              <p className="text-gray-600">決算公告のPDFファイルをアップロードしてください。</p>
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
