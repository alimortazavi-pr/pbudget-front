import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { VenturesPage } from "@/components/pages/partners/VenturesPage";

export default function Page() {
  return (
    <FeatureGate feature="partners">
      <VenturesPage />
    </FeatureGate>
  );
}
