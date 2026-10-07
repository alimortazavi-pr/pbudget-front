import { WelcomeDemoNotice } from "@/components/common/subscription/TrialPromo";
import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { Suspense } from "react";

import { AnalysisPage } from "@/components/pages/analysis";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <FeatureGate feature="analytics">
        <WelcomeDemoNotice />
        <AnalysisPage />
      </FeatureGate>
    </Suspense>
  );
}
