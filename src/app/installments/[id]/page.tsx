import { PaymentPlanDetailPage } from "@/components/pages/planning/PaymentPlanDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <PaymentPlanDetailPage planId={id} />;
}
