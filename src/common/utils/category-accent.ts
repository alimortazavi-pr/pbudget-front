import { resolveCategoryColor } from "@/common/constants/category-colors";

export function categoryAccentStyle(color?: string | null, index = 0) {
  const resolved = resolveCategoryColor(color, index);

  return {
    borderInlineStartWidth: "3px",
    borderInlineStartStyle: "solid" as const,
    borderInlineStartColor: resolved,
    borderColor: `color-mix(in srgb, ${resolved} 32%, var(--border))`,
  };
}
