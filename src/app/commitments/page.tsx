import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { Suspense } from "react";

import { RunningTabsPage } from "@/components/pages/planning/RunningTabsPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <FeatureGate feature="commitments">
        <RunningTabsPage />
      </FeatureGate>
    </Suspense>
  );
}
