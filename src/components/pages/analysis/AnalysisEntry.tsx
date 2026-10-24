"use client";

import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { WelcomeDemoNotice } from "@/components/common/subscription/TrialPromo";
import { AnalysisPage } from "@/components/pages/analysis/AnalysisPage";
import { CategoryTotalsPage } from "@/components/pages/analysis/CategoryTotalsPage";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";

/**
 * Full analysis on plans that include it; otherwise the free per-category
 * totals (when the plan has them), or the upgrade screen.
 */
export function AnalysisEntry() {
  const { loading, data, isFeatureEnabled } = useSubscriptionAccess();
  if (loading && !data) return <div className="pb-shimmer h-48 w-full rounded-2xl" aria-hidden />;
  if (!isFeatureEnabled("analytics") && isFeatureEnabled("category_totals")) return <CategoryTotalsPage />;
  return (
    <FeatureGate feature="analytics">
      <WelcomeDemoNotice />
      <AnalysisPage />
    </FeatureGate>
  );
}
