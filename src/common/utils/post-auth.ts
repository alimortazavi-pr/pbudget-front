import type { IProfile } from "@/common/interfaces/profile.interface";
import * as authApi from "@/common/api/auth";
import { PATHS } from "@/common/constants";
import {
  consumeAuthReturnUrl,
  validateAuthReturnUrl,
} from "@/common/utils/auth-flow";
import { queuePersonaOnboarding } from "@/common/utils/persona-onboarding";
import { shouldShowWorkspacePicker } from "@/common/utils/workspace-choice";

export type PostLoginChoice = {
  id: string;
  label: string;
  description: string;
  path: string;
  kind: string;
};

export type PostLoginContext = {
  suggestedPath: string;
  choices: PostLoginChoice[];
  pendingInvitesCount: number;
  businessCount: number;
};

export async function resolvePostAuthDestination(options?: {
  returnUrl?: string | null;
  user?: IProfile | null;
}): Promise<{
  path: string | null;
  context: PostLoginContext | null;
  needsPicker: boolean;
}> {
  const fromQuery = validateAuthReturnUrl(options?.returnUrl ?? null);
  const fromStorage = consumeAuthReturnUrl();
  const explicit = fromQuery ?? fromStorage;

  if (explicit) {
    return { path: explicit, context: null, needsPicker: false };
  }

  try {
    const context = await authApi.fetchPostLoginContext();

    if (shouldShowWorkspacePicker(context.choices)) {
      return { path: null, context, needsPicker: true };
    }

    const single = context.choices[0];
    if (single) {
      queuePersonaOnboarding(single.kind);
    }
    return {
      path: context.suggestedPath || PATHS.HOME,
      context,
      needsPicker: false,
    };
  } catch {
    if (options?.user?.isAdmin) {
      return { path: PATHS.ADMIN, context: null, needsPicker: false };
    }
    return { path: PATHS.HOME, context: null, needsPicker: false };
  }
}
