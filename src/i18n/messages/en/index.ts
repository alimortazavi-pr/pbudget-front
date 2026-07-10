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
import { budgetMessages } from "./budget";
import { pageHeroMessages } from "./pageHero";
import { downloadMessages } from "./download";
import { landingMessages } from "./landing";
import { brandMessages } from "./brand";
import { pagesMessages } from "./pages";
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
    { budget: budgetMessages },
    { pageHero: pageHeroMessages },
    { download: downloadMessages },
    { landing: landingMessages },
    { brand: brandMessages },
    { pages: pagesMessages },
  ),
  ...autoFlat,
};
