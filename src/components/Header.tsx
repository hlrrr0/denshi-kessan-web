"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "@/lib/auth";
import { onAuthStateChanged, User } from "firebase/auth";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth) return;

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    const result = await signOut();
    
    if (!result.error) {
      router.push("/login");
    } else {
      alert(result.error);
      setLoading(false);
    }
  };

  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <a href="/" className="text-xl font-bold text-gray-800">
            電子決算公告
          </a>
          
          <div className="flex items-center gap-4">
            <a href="/settlements" className="text-gray-600 hover:text-gray-800">
              公告一覧
            </a>
            <a href="http://media.denshi-kessan-koukoku.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-800">
              コラム
            </a>
            
            {user ? (
              <>
                {!pathname?.startsWith("/mypage") && (
                  <a href="/mypage" className="text-gray-600 hover:text-gray-800">
                    マイページ
                  </a>
                )}
                <button
                  onClick={handleSignOut}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-400"
                >
                  {loading ? "..." : "ログアウト"}
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="text-gray-600 hover:text-gray-800">
                  ログイン
                </a>
                <a
                  href="/signup"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  新規登録
                </a>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
