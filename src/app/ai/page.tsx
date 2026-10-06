import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { AiAssistantPage } from "@/components/pages/ai/AiAssistantPage";

export default function Page() {
  return (
    <FeatureGate feature="ai">
      <AiAssistantPage />
    </FeatureGate>
  );
}
