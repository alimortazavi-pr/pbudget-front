import { BusinessAttendanceShiftsPage } from "@/components/pages/business/BusinessAttendanceShiftsPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessAttendanceShiftsPage businessId={id} />;
}
