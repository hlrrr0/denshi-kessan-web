"use client";

import AdminGuard from "@/components/AdminGuard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "@/lib/auth";
import { useState } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const navItems = [
    { href: "/admin", label: "ダッシュボード", icon: "📊" },
    { href: "/admin/users", label: "ユーザー管理", icon: "👥" },
  ];

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/login");
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-blue-800 text-white shadow-lg">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-lg font-bold">
                管理パネル
              </Link>
              <span className="text-blue-300 text-sm">|</span>
              <Link href="/" className="text-blue-200 text-sm hover:text-white">
                サイトに戻る
              </Link>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="px-3 py-1.5 bg-blue-700 text-sm rounded hover:bg-blue-600 disabled:opacity-50"
            >
              ログアウト
            </button>
          </div>
        </header>

        <div className="flex">
          {/* サイドバー */}
          <aside className="w-56 bg-white shadow-sm min-h-[calc(100vh-56px)]">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-blue-50 text-blue-700 border-l-3 border-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* メインコンテンツ */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
