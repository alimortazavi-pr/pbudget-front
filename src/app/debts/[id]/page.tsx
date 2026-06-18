import { DebtDetailPage } from "@/components/pages/debts/DebtDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <DebtDetailPage debtId={id} />;
}
