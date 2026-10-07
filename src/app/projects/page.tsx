import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { ProjectsPage } from "@/components/pages/projects/ProjectsPage";

export default function Page() {
  return (
    <FeatureGate feature="projects">
      <ProjectsPage />
    </FeatureGate>
  );
}
