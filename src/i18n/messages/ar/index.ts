import type { MessageTree } from "../../types";
import { flattenMessages } from "../../flatten";
import { commonMessages } from "./common";
import { navMessages } from "./nav";
import { dashboardMessages } from "./dashboard";
import { projectsMessages } from "./projects";
import { debtsMessages } from "./debts";
import { adminMessages } from "./admin";
import { voiceMessages } from "./voice";
import { planningMessages } from "./planning";
import { categoriesMessages } from "./categories";
import { autoMessages } from "./auto";

function merge(...trees: MessageTree[]): Record<string, string> {
  return Object.assign({}, ...trees.map((t) => flattenMessages(t)));
}

const autoFlat = Object.fromEntries(
  Object.entries(autoMessages).map(([k, v]) => [`auto.${k}`, v]),
);

export const messages = {
  ...merge(
    { nav: navMessages },
    { common: commonMessages },
    { dashboard: dashboardMessages },
    { projects: projectsMessages },
    { debts: debtsMessages },
    { admin: adminMessages },
    { voice: voiceMessages },
    { planning: planningMessages },
    { categories: categoriesMessages },
  ),
  ...autoFlat,
};
