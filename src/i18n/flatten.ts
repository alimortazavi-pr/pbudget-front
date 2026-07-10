import type { MessageTree } from "./types";

export function flattenMessages(
  tree: MessageTree,
  prefix = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[fullKey] = value;
    } else {
      Object.assign(out, flattenMessages(value, fullKey));
    }
  }
  return out;
}
