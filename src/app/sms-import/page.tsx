import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { SmsImportPage } from "@/components/pages/sms-import/SmsImportPage";

export default function Page() {
  return (
    <FeatureGate feature="sms_import">
      <SmsImportPage />
    </FeatureGate>
  );
}
