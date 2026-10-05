import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { BankImportWizardPage } from "@/components/pages/bank-import/BankImportWizardPage";

export default function Page() {
  return <FeatureGate feature="bank_import">
      <BankImportWizardPage />
    </FeatureGate>;
}
