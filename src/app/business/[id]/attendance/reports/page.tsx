import { BusinessAttendanceReportsPage } from "@/components/pages/business/BusinessAttendanceReportsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessAttendanceReportsPage businessId={id} />;
}
