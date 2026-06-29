import { BusinessAttendanceMePage } from "@/components/pages/business/BusinessAttendanceMePage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessAttendanceMePage businessId={id} />;
}
