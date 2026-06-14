import { Suspense } from "react";

import { ChecksPage } from "@/components/pages/planning/ChecksPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="pb-shimmer h-40 w-full rounded-2xl" />}>
      <ChecksPage />
    </Suspense>
  );
}
