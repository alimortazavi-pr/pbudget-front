import { BusinessAttendanceTeamPage } from "@/components/pages/business/BusinessAttendanceTeamPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <BusinessAttendanceTeamPage businessId={id} />;
}
