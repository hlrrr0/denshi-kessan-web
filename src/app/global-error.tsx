"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <div style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            textAlign: "center",
            backgroundColor: "#fff",
            border: "2px solid #d1d5db",
            borderRadius: "0.5rem",
            padding: "2rem",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937", marginBottom: "0.5rem" }}>
              システムエラー
            </h1>
            <p style={{ color: "#4b5563", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
              申し訳ございません。システムエラーが発生しました。
              <br />
              しばらく時間をおいてから再度お試しください。
            </p>
            <button
              onClick={reset}
              style={{
                backgroundColor: "#1d4ed8",
                color: "#fff",
                padding: "0.5rem 1.5rem",
                borderRadius: "0.375rem",
                border: "none",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
