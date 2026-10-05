import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { PaymentPlanDetailPage } from "@/components/pages/planning/PaymentPlanDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <FeatureGate feature="installments">
      <PaymentPlanDetailPage planId={id} />
    </FeatureGate>;
}
