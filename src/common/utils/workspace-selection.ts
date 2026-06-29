import type { PostLoginChoice } from "@/common/utils/post-auth";
import * as authApi from "@/common/api/auth";
import { queuePersonaOnboarding } from "@/common/utils/persona-onboarding";
import { saveLastWorkspace } from "@/common/utils/workspace-memory";

export async function completeWorkspaceSelection(choice: PostLoginChoice) {
  saveLastWorkspace({
    path: choice.path,
    kind: choice.kind,
    label: choice.label,
  });
  queuePersonaOnboarding(choice.kind);
  try {
    await authApi.logWorkspaceSelection({
      path: choice.path,
      kind: choice.kind,
      label: choice.label,
    });
  } catch {
    // audit is best-effort
  }
}
