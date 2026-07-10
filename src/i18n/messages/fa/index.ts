import type { MessageTree } from "../../types";
import { flattenMessages } from "../../flatten";
import { commonMessages } from "./common";
import { navMessages } from "./nav";
import { generatedMessages } from "./generated";

function merge(...trees: MessageTree[]): Record<string, string> {
  return Object.assign({}, ...trees.map((t) => flattenMessages(t)));
}

export const messages = {
  ...merge({ nav: navMessages }, { common: commonMessages }),
  ...generatedMessages,
};
