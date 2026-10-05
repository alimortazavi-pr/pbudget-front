export const DEFAULT_CATEGORY_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
  "#0ea5e9",
] as const;

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export function isValidHexColor(value: string) {
  return HEX_COLOR.test(value);
}

/**
 * The category's own color, or a stable palette color. Pass the category id as
 * `seed` so categories without a color still get distinct, consistent colors
 * everywhere (before, every one of them fell back to the same red).
 */
export function resolveCategoryColor(color?: string | null, seed: number | string = 0) {
  if (color && isValidHexColor(color)) return color;
  let index = typeof seed === "number" ? seed : 0;
  if (typeof seed === "string") {
    for (let i = 0; i < seed.length; i++) index = (index * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return DEFAULT_CATEGORY_COLORS[index % DEFAULT_CATEGORY_COLORS.length];
}
