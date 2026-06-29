import { BusinessDashboardPage } from "@/components/pages/business/BusinessDashboardPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessDashboardPage businessId={id} />;
}
