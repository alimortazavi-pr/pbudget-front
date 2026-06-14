import { Suspense } from "react";

import { DashboardPage } from "@/components/pages/dashboard";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <DashboardPage />
    </Suspense>
  );
}
