"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <title>خطا | میز پردیس</title>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 480 }}>
            <h1>مشکلی پیش آمد</h1>
            <p style={{ color: "#64748b", lineHeight: 1.9 }}>
              اطلاعات شما محفوظ است. لطفاً دوباره تلاش کنید.
            </p>
            <button type="button" onClick={unstable_retry} style={{ border: 0, borderRadius: 12, padding: "12px 20px", background: "#e11d48", color: "white", cursor: "pointer" }}>
              تلاش دوباره
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
