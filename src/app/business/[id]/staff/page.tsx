import { BusinessStaffPage } from "@/components/pages/business/BusinessStaffPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessStaffPage businessId={id} />;
}
