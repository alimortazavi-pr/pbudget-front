import { FeatureGate } from "@/components/common/subscription/FeatureGate";
import { WorkAttendancePage } from "@/components/pages/projects/WorkAttendancePage";

export default function Page() {
  return <FeatureGate feature="work_time">
      <WorkAttendancePage />
    </FeatureGate>;
}
