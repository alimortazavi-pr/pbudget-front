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

export function resolveCategoryColor(color?: string | null, index = 0) {
  if (color && isValidHexColor(color)) return color;
  return DEFAULT_CATEGORY_COLORS[index % DEFAULT_CATEGORY_COLORS.length];
}
