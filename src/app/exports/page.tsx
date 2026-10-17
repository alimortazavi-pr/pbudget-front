import { Suspense } from "react";

import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { ExportCenterPage } from "@/components/pages/exports/ExportCenterPage";

export default function Page() {
  return (
    <FeatureGate feature="export_center">
      <Suspense fallback={<div className="pb-shimmer h-96 w-full rounded-3xl" aria-hidden />}>
        <ExportCenterPage />
      </Suspense>
    </FeatureGate>
  );
}
