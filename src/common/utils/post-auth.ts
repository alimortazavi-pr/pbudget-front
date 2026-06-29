import type { IProfile } from "@/common/interfaces/profile.interface";
import * as authApi from "@/common/api/auth";
import { PATHS } from "@/common/constants";
import {
  consumeAuthReturnUrl,
  validateAuthReturnUrl,
} from "@/common/utils/auth-flow";
import { getLastWorkspace } from "@/common/utils/workspace-memory";
import { queuePersonaOnboarding } from "@/common/utils/persona-onboarding";

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

    const last = getLastWorkspace();
    if (last) {
      const remembered = context.choices.find((c) => c.path === last.path);
      if (remembered) {
        queuePersonaOnboarding(remembered.kind);
        return {
          path: remembered.path,
          context,
          needsPicker: false,
        };
      }
    }

    if (context.choices.length > 1) {
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
