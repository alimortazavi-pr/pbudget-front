import { Suspense } from "react";
import { SsoCallbackPage } from "@/components/pages/auth/SsoCallbackPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center p-6 text-muted">
          در حال بارگذاری…
        </div>
      }
    >
      <SsoCallbackPage />
    </Suspense>
  );
}
