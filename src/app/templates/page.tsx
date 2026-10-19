import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { TemplatesPage } from "@/components/pages/templates/TemplatesPage";

export default function Page() {
  return (
    <FeatureGate feature="templates">
      <TemplatesPage />
    </FeatureGate>
  );
}
