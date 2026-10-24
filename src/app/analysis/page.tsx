import { Suspense } from "react";

import { AnalysisEntry } from "@/components/pages/analysis/AnalysisEntry";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <AnalysisEntry />
    </Suspense>
  );
}
