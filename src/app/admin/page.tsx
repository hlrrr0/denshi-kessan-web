"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  noSubscription: number;
  totalCompanies: number;
  totalNotices: number;
  planBreakdown: Record<string, number>;
  cachedAt?: string;
}

const PLAN_LABELS: Record<string, string> = {
  "1year": "年額プラン（¥3,960）",
  "1year_legacy": "年額プラン（¥980・旧）",
  "5year": "5年プラン（¥15,400）",
  "5year_legacy": "5年プラン（¥3,920・旧）",
  "10year": "10年プラン（¥22,000）",
  unknown: "不明",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats(false);
  }, []);

  const fetchStats = async (forceRefresh: boolean) => {
    try {
      if (forceRefresh) setRefreshing(true);
      const user = auth?.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const url = forceRefresh
        ? "/api/admin/dashboard?refresh=1"
        : "/api/admin/dashboard";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch stats");
      }

      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
        <p className="font-medium">エラーが発生しました</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: "総ユーザー数",
      value: stats.totalUsers,
      color: "bg-blue-500",
      icon: "👥",
      href: "/admin/users",
    },
    {
      label: "有効サブスクリプション",
      value: stats.activeSubscriptions,
      color: "bg-green-500",
      icon: "✅",
      href: "/admin/users?filter=active",
    },
    {
      label: "期限切れ",
      value: stats.expiredSubscriptions,
      color: "bg-yellow-500",
      icon: "⏰",
      href: "/admin/users?filter=expired",
    },
    {
      label: "未契約",
      value: stats.noSubscription,
      color: "bg-gray-400",
      icon: "➖",
      href: "/admin/users?filter=none",
    },
    {
      label: "登録企業数",
      value: stats.totalCompanies,
      color: "bg-indigo-500",
      icon: "🏢",
      href: null,
    },
    {
      label: "決算公告数",
      value: stats.totalNotices,
      color: "bg-purple-500",
      icon: "📄",
      href: null,
    },
  ];

  const formatCachedAt = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleString("ja-JP");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>
        <div className="flex items-center gap-3">
          {stats?.cachedAt && (
            <span className="text-xs text-gray-400">
              最終更新: {formatCachedAt(stats.cachedAt)}
            </span>
          )}
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-white border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1.5"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? "更新中..." : "更新"}
          </button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            onClick={() => card.href && router.push(card.href)}
            className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 transition-all ${
              card.href
                ? "cursor-pointer hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}
              >
                {card.icon}
              </div>
            </div>
            {card.href && (
              <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                詳細を見る →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* プラン別内訳 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          プラン別契約内訳
        </h2>
        {Object.keys(stats.planBreakdown).length === 0 ? (
          <p className="text-gray-500 text-sm">データがありません</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.planBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([planId, count]) => (
                <div
                  key={planId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <span className="text-sm text-gray-700">
                    {PLAN_LABELS[planId] || planId}
                  </span>
                  <span className="font-bold text-gray-800">
                    {count.toLocaleString()}件
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
