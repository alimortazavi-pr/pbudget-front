import { BusinessBudgetFormPage } from "@/components/pages/business/BusinessBudgetFormPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessBudgetFormPage businessId={id} />;
}
