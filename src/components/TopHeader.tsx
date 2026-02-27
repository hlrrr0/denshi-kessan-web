"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "@/lib/auth";
import { onAuthStateChanged, User } from "firebase/auth";

export default function TopHeader() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    const result = await signOut();

    if (!result.error) {
      setUser(null);
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-900">
          電子決算公告ドットコム
        </h1>
        <nav className="flex items-center gap-6">
          <a href="http://media.denshi-kessan-koukoku.com/" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-blue-700 font-medium">
            コラム
          </a>
          {authChecked && user ? (
            <>
              <Link href="/mypage" className="text-gray-700 hover:text-blue-700 font-medium">
                マイページ
              </Link>
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                {loading ? "..." : "ログアウト"}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-700 hover:text-blue-700 font-medium">
                ログイン
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 font-medium"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
