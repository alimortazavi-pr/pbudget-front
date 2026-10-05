import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { DebtDetailPage } from "@/components/pages/debts/DebtDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <FeatureGate feature="debts">
      <DebtDetailPage debtId={id} />
    </FeatureGate>;
}
