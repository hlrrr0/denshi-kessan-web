"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import Link from "next/link";

interface UserItem {
  uid: string;
  email: string;
  name: string;
  phone: string;
  payjpCustomerId: string;
  createdAt: string | null;
  companyName: string;
  companyCount: number;
  planId: string;
  subscriptionStatus: string;
  expirationDate: string | null;
  automaticRenewal: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  "1year": "年額（¥3,960）",
  "1year_legacy": "年額（¥980）",
  "5year": "5年（¥15,400）",
  "5year_legacy": "5年（¥3,920）",
  "10year": "10年（¥22,000）",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active: { label: "有効", className: "bg-green-100 text-green-700" },
  expired: { label: "期限切れ", className: "bg-yellow-100 text-yellow-700" },
  none: { label: "未契約", className: "bg-gray-100 text-gray-500" },
};

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-700"></div>
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "all";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const [searchInput, setSearchInput] = useState("");
  const [cachedAt, setCachedAt] = useState("");

  useEffect(() => {
    fetchUsers(1);
  }, [filter]);

  const fetchUsers = async (p: number, searchQuery?: string, refresh?: boolean) => {
    try {
      setLoading(true);
      const user = auth?.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (searchQuery !== undefined ? searchQuery : search)
        params.set("search", searchQuery !== undefined ? searchQuery : search);
      if (filter !== "all") params.set("filter", filter);
      if (refresh) params.set("refresh", "1");

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
      if (data.cachedAt) setCachedAt(data.cachedAt);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchUsers(1, searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    fetchUsers(1, "");
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchUsers(p);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ja-JP");
  };

  // ページネーションボタン生成
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ユーザー管理</h1>
        <div className="flex items-center gap-3">
          {cachedAt && (
            <span className="text-xs text-gray-400">
              更新: {new Date(cachedAt).toLocaleString("ja-JP")}
            </span>
          )}
          <button
            onClick={() => fetchUsers(page, undefined, true)}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-gray-300 text-xs text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            再取得
          </button>
          <span className="text-sm text-gray-500">{total}件</span>
        </div>
      </div>

      {/* 検索・フィルター */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="名前、メール、会社名で検索..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800"
            >
              検索
            </button>
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-3 py-2 bg-gray-200 text-gray-600 text-sm rounded-md hover:bg-gray-300"
              >
                クリア
              </button>
            )}
          </form>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">すべて</option>
            <option value="active">有効</option>
            <option value="expired">期限切れ</option>
            <option value="none">未契約</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-4">
          {error}
        </div>
      )}

      {/* ユーザーテーブル */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-700"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {search ? "該当するユーザーが見つかりません" : "ユーザーがいません"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">名前</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">メール</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">企業</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">プラン</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">有効期限</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">登録日</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const badge = STATUS_BADGE[user.subscriptionStatus] || STATUS_BADGE.none;
                  return (
                    <tr key={user.uid} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">
                          {user.name || <span className="text-gray-400">未設定</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">
                        {user.companyName ? (
                          <span className="text-gray-700">
                            {user.companyName}
                            {user.companyCount > 1 && (
                              <span className="text-gray-400 text-xs ml-1">
                                +{user.companyCount - 1}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {user.planId
                          ? PLAN_LABELS[user.planId] || user.planId
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {user.expirationDate
                          ? formatDate(user.expirationDate)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users/${user.uid}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          詳細
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            前へ
          </button>
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-gray-400">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goToPage(p as number)}
                className={`px-3 py-1.5 text-sm border rounded-md ${
                  p === page
                    ? "bg-blue-700 text-white border-blue-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
}
