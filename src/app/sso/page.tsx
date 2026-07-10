import { Suspense } from "react";
import { SsoCallbackPage } from "@/components/pages/auth/SsoCallbackPage";
import { SsoLoadingFallback } from "@/components/pages/auth/SsoLoadingFallback";

export default function Page() {
  return (
    <Suspense fallback={<SsoLoadingFallback />}>
      <SsoCallbackPage />
    </Suspense>
  );
}
