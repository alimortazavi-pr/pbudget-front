import { BusinessTransactionsPage } from "@/components/pages/business/BusinessTransactionsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessTransactionsPage businessId={id} />;
}
