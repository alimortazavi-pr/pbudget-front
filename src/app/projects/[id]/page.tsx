import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { ProjectDetailPage } from "@/components/pages/projects/ProjectDetailPage";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return (
    <FeatureGate feature="projects">
      <ProjectDetailPage projectId={id} />
    </FeatureGate>
  );
}
