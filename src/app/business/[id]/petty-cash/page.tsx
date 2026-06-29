import { BusinessPettyCashPage } from "@/components/pages/business/BusinessPettyCashPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessPettyCashPage businessId={id} />;
}
