import { ProjectAttendancePage } from "@/components/pages/projects/ProjectAttendancePage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ProjectAttendancePage projectId={id} />;
}
