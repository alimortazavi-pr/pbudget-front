import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { AssetsPage } from "@/components/pages/assets/AssetsPage";

export default function Page() {
  return (
    <FeatureGate feature="assets">
      <AssetsPage />
    </FeatureGate>
  );
}
