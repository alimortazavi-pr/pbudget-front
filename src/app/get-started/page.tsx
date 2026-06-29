import { Suspense } from "react";

import { GetStartedPage } from "@/components/pages/auth";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <GetStartedPage />
    </Suspense>
  );
}
