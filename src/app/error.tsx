"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white border-2 border-gray-300 rounded-lg p-8 shadow-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            エラーが発生しました
          </h1>
          <p className="text-gray-600 mb-6">
            申し訳ございません。予期しないエラーが発生しました。
            <br />
            しばらく時間をおいてから再度お試しください。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-block bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition-colors text-sm font-medium"
            >
              再試行
            </button>
            <a
              href="/"
              className="inline-block bg-white text-blue-700 border-2 border-blue-700 px-6 py-2 rounded-md hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              トップページへ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
