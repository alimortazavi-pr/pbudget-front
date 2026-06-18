import { Suspense } from "react";

import { InstallmentsPage } from "@/components/pages/planning/InstallmentsPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <InstallmentsPage />
    </Suspense>
  );
}
