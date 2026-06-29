import { BusinessBudgetEditPage } from "@/components/pages/business/BusinessBudgetEditPage";

type PageProps = {
  params: Promise<{ id: string; budgetId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id, budgetId } = await params;
  return (
    <BusinessBudgetEditPage businessId={id} budgetId={budgetId} />
  );
}
