import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { BoxesPage } from "@/components/pages/boxes";

export default function Page() {
  return (
    <FeatureGate feature="boxes">
      <BoxesPage />
    </FeatureGate>
  );
}
