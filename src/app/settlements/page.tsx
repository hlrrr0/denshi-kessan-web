import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default async function SettlementsPage() {
  const q = query(
    collection(db, "subscriptions"),
    where("active", "==", true)
  );
  const snap = await getDocs(q);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">電子決算公告一覧</h1>
        <div className="grid gap-4">
          {snap.docs.map(doc => (
            <div key={doc.id} className="bg-white p-6 rounded-lg shadow">
              <p className="font-medium">{doc.id}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
