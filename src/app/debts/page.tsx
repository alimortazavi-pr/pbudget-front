import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { DebtsPage } from "@/components/pages/debts/DebtsPage";

export default function Page() {
  return <FeatureGate feature="debts">
      <DebtsPage />
    </FeatureGate>;
}
