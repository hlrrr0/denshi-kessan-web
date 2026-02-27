"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn, resetPassword } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // ログイン成功 → マイページへ
      router.push("/mypage");
    } catch (err) {
      setError("予期しないエラーが発生しました");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setResetMessage(null);

    if (!resetEmail) {
      setResetMessage({ type: "error", text: "メールアドレスを入力してください" });
      return;
    }

    setResetLoading(true);
    const result = await resetPassword(resetEmail);
    setResetLoading(false);

    if (result.error) {
      setResetMessage({ type: "error", text: result.error });
    } else {
      setResetMessage({ type: "success", text: "パスワードリセットメールを送信しました。メールをご確認ください。" });
      setResetEmail("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">ログイン</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => { setShowResetForm(!showResetForm); setResetMessage(null); }}
            className="text-sm text-blue-600 hover:underline"
          >
            パスワードをお忘れの方
          </button>
        </div>

        {showResetForm && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h2 className="text-sm font-semibold mb-2">パスワードリセット</h2>
            <p className="text-xs text-gray-600 mb-3">
              登録済みのメールアドレスを入力してください。パスワードリセット用のメールをお送りします。
            </p>

            {resetMessage && (
              <div
                className={`mb-3 p-2 text-sm rounded ${
                  resetMessage.type === "success"
                    ? "bg-green-100 border border-green-400 text-green-700"
                    : "bg-red-100 border border-red-400 text-red-700"
                }`}
              >
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3">
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={resetLoading}
              />
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-gray-700 text-white py-2 rounded-md text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {resetLoading ? "送信中..." : "リセットメールを送信"}
              </button>
            </form>
          </div>
        )}

        <p className="mt-4 text-center text-sm">
          アカウントをお持ちでない方は
          <a href="/signup" className="text-blue-600 hover:underline ml-1">
            新規登録
          </a>
        </p>
      </div>
    </div>
  );
}
