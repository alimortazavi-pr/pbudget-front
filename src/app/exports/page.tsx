import { Suspense } from "react";

import { ExportCenterPage } from "@/components/pages/exports/ExportCenterPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-96 w-full rounded-3xl" aria-hidden />}>
      <ExportCenterPage />
    </Suspense>
  );
}
