import { getTranslator } from "@/i18n";
const t = getTranslator();
import type { PostLoginChoice } from "@/common/utils/post-auth";

export type WorkspaceGroupId = "personal" | "business" | "system";

export type WorkspaceGroup = {
  id: WorkspaceGroupId;
  title: string;
  description: string;
  kinds: string[];
};

export const WORKSPACE_GROUPS: WorkspaceGroup[] = [
  {
    id: "personal",
    title: t("nav.personalDesk"),
    description: t("auto.k96ae152a17"),
    kinds: ["personal"],
  },
  {
    id: "business",
    title: t("auto.k1872cb485c"),
    description: t("auto.k0c35146ef2"),
    kinds: ["business", "attendance"],
  },
  {
    id: "system",
    title: t("auto.k6ce2329337"),
    description: t("auto.k01ecfed111"),
    kinds: ["admin", "invites"],
  },
];

export function shouldShowWorkspacePicker(choices: PostLoginChoice[]): boolean {
  return choices.some(
    (choice) => choice.kind !== "personal" && choices.length > 1,
  );
}

export function groupWorkspaceChoices(choices: PostLoginChoice[]) {
  return WORKSPACE_GROUPS.map((group) => ({
    ...group,
    items: choices.filter((choice) => group.kinds.includes(choice.kind)),
  })).filter((group) => group.items.length > 0);
}

export function sortWorkspaceGroups(
  groups: ReturnType<typeof groupWorkspaceChoices>,
) {
  const priority: WorkspaceGroupId[] = ["personal", "business", "system"];
  return [...groups].sort(
    (a, b) => priority.indexOf(a.id) - priority.indexOf(b.id),
  );
}

export function getSuggestedChoice(choices: PostLoginChoice[]) {
  return choices.find((choice) => choice.kind === "personal") ?? choices[0];
}
