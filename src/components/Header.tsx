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
  const [menuOpen, setMenuOpen] = useState(false);

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
            電子決算公告ドットコム
          </a>

          {/* ハンバーガーボタン (mobile) */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-800"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          
          {/* デスクトップメニュー */}
          <div className="hidden md:flex items-center gap-4">
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

        {/* モバイルメニュー */}
        {menuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3">
            <a href="/settlements" className="block text-gray-600 hover:text-gray-800 py-2" onClick={() => setMenuOpen(false)}>
              公告一覧
            </a>
            <a href="http://media.denshi-kessan-koukoku.com/" target="_blank" rel="noopener noreferrer" className="block text-gray-600 hover:text-gray-800 py-2">
              コラム
            </a>
            {user ? (
              <>
                {!pathname?.startsWith("/mypage") && (
                  <a href="/mypage" className="block text-gray-600 hover:text-gray-800 py-2" onClick={() => setMenuOpen(false)}>
                    マイページ
                  </a>
                )}
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  disabled={loading}
                  className="w-full text-left text-gray-600 hover:text-gray-800 py-2 disabled:text-gray-400"
                >
                  {loading ? "..." : "ログアウト"}
                </button>
              </>
            ) : (
              <>
                <a href="/login" className="block text-gray-600 hover:text-gray-800 py-2" onClick={() => setMenuOpen(false)}>
                  ログイン
                </a>
                <a href="/signup" className="block text-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => setMenuOpen(false)}>
                  新規登録
                </a>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
