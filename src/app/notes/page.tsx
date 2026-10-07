import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { Suspense } from "react";

import { NotesPage } from "@/components/pages/planning/NotesPage";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <FeatureGate feature="notes">
        <NotesPage />
      </FeatureGate>
    </Suspense>
  );
}
