import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { ProjectAttendancePage } from "@/components/pages/projects/ProjectAttendancePage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <FeatureGate feature="work_time">
      <ProjectAttendancePage projectId={id} />
    </FeatureGate>;
}
