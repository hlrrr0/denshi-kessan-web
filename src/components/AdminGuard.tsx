"use client";

import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const ADMIN_EMAILS = [
  "hiroki.imai@super-shift.co.jp",
  "hiroki19910602@gmail.com",
];

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      router.push("/login");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // メールアドレスで管理者チェック
      if (!ADMIN_EMAILS.includes(user.email || "")) {
        router.push("/mypage");
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">認証確認中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
