"use client";

import { useEffect, useState, use } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface UserDetail {
  uid: string;
  email: string;
  name: string;
  phone: string;
  active: boolean;
  payjpCustomerId: string;
  payjpCardId: string;
  role: string;
  legacyUuid: string;
  createdAt: string | null;
  updatedAt: string | null;
  companies: {
    id: string;
    name: string;
    nameFurigana: string;
    representativeName: string;
    capital: string;
    officeAddress: string;
    accountClosingMonth: string;
    subscriptionActive: boolean;
    subscriptionExpiresAt: string | null;
  }[];
  subscription: {
    planId: string;
    active: boolean;
    expirationDate: string | null;
    automaticRenewal: boolean;
    payjpId: string;
    payjpType: string;
    amount: number | null;
  } | null;
  totalNotices: number;
}

const PLAN_LABELS: Record<string, string> = {
  "1year": "年額プラン（¥3,960）",
  "1year_legacy": "年額プラン（¥980・旧）",
  "5year": "5年プラン（¥15,400）",
  "5year_legacy": "5年プラン（¥3,920・旧）",
  "10year": "10年プラン（¥22,000）",
};

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: uid } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 編集フォーム
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    fetchUser();
  }, [uid]);

  const fetchUser = async () => {
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch user");
      }

      const data = await res.json();
      setUser(data);
      setEditName(data.name);
      setEditPhone(data.phone);
      setEditEmail(data.email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const currentUser = auth?.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          email: editEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setMessage({ type: "success", text: "更新しました" });
      setEditing(false);
      await fetchUser();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      const currentUser = auth?.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      setMessage({ type: "success", text: "退会処理が完了しました" });
      setTimeout(() => router.push("/admin/users"), 1500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <button
          onClick={() => router.push("/admin/users")}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800"
        >
          ← ユーザー一覧に戻る
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/users")}
            className="text-gray-500 hover:text-gray-700"
          >
            ← 戻る
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {user.name || "名前未設定"}
          </h1>
          {!user.active && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
              退会済み
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!editing && user.active && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800"
              >
                編集
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
              >
                退会処理
              </button>
            </>
          )}
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`p-3 rounded-lg text-sm mb-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 退会確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">退会処理の確認</h3>
            <p className="text-sm text-gray-600 mb-1">
              <strong>{user.name || user.email}</strong> を退会処理します。
            </p>
            <p className="text-sm text-gray-600 mb-4">
              アカウントが無効化され、Pay.jpのサブスクリプションもキャンセルされます。この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "処理中..." : "退会を実行"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ユーザー情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">ユーザー情報</h2>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">名前</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">電話番号</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-700 text-white text-sm rounded-md hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(user.name);
                    setEditPhone(user.phone);
                    setEditEmail(user.email);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <dl className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">UID</dt>
                <dd className="text-sm text-gray-800 font-mono">{user.uid}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">名前</dt>
                <dd className="text-sm text-gray-800">{user.name || "-"}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">メール</dt>
                <dd className="text-sm text-gray-800">{user.email}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">電話番号</dt>
                <dd className="text-sm text-gray-800">{user.phone || "-"}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">ステータス</dt>
                <dd className="text-sm">
                  {user.active ? (
                    <span className="text-green-600">有効</span>
                  ) : (
                    <span className="text-red-600">無効</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">登録日時</dt>
                <dd className="text-sm text-gray-800">{formatDate(user.createdAt)}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">更新日時</dt>
                <dd className="text-sm text-gray-800">{formatDate(user.updatedAt)}</dd>
              </div>
              {user.legacyUuid && (
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <dt className="text-sm text-gray-500">旧UUID</dt>
                  <dd className="text-sm text-gray-800 font-mono text-xs">{user.legacyUuid}</dd>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <dt className="text-sm text-gray-500">Pay.jp顧客ID</dt>
                <dd className="text-sm text-gray-800 font-mono text-xs">
                  {user.payjpCustomerId || "-"}
                </dd>
              </div>
            </dl>
          )}
        </div>

        {/* サブスクリプション情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-800 mb-4">サブスクリプション</h2>
          {user.subscription ? (
            <dl className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">プラン</dt>
                <dd className="text-sm text-gray-800">
                  {PLAN_LABELS[user.subscription.planId] || user.subscription.planId || "-"}
                </dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">ステータス</dt>
                <dd className="text-sm">
                  {user.subscription.active ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      有効
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      無効
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">有効期限</dt>
                <dd className="text-sm text-gray-800">
                  {formatDate(user.subscription.expirationDate)}
                </dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">自動更新</dt>
                <dd className="text-sm text-gray-800">
                  {user.subscription.automaticRenewal ? "あり" : "なし"}
                </dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <dt className="text-sm text-gray-500">決済タイプ</dt>
                <dd className="text-sm text-gray-800">
                  {user.subscription.payjpType === "subscription" ? "サブスクリプション" : "一回払い"}
                </dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-sm text-gray-500">Pay.jp ID</dt>
                <dd className="text-sm text-gray-800 font-mono text-xs">
                  {user.subscription.payjpId || "-"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-gray-500 text-sm">サブスクリプション情報がありません</p>
          )}
        </div>

        {/* 企業情報 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">企業情報</h2>
            <span className="text-sm text-gray-500">
              {user.companies.length}社 / 決算公告 {user.totalNotices}件
            </span>
          </div>
          {user.companies.length === 0 ? (
            <p className="text-gray-500 text-sm">企業情報が登録されていません</p>
          ) : (
            <div className="space-y-3">
              {user.companies.map((company) => (
                <div
                  key={company.id}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">
                      {company.name || "未設定"}
                    </h3>
                    {company.subscriptionActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        公開中
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                        非公開
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500">フリガナ: </span>
                      <span className="text-gray-700">{company.nameFurigana || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">代表者: </span>
                      <span className="text-gray-700">{company.representativeName || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">資本金: </span>
                      <span className="text-gray-700">{company.capital || "-"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">決算月: </span>
                      <span className="text-gray-700">
                        {company.accountClosingMonth ? `${company.accountClosingMonth}月` : "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">住所: </span>
                      <span className="text-gray-700">{company.officeAddress || "-"}</span>
                    </div>
                    {company.subscriptionExpiresAt && (
                      <div className="col-span-2">
                        <span className="text-gray-500">有効期限: </span>
                        <span className="text-gray-700">
                          {formatDate(company.subscriptionExpiresAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
