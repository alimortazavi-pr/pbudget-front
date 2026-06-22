import { resolveCategoryColor } from "@/common/constants/category-colors";

export function categoryAccentStyle(color?: string | null, index = 0) {
  const resolved = resolveCategoryColor(color, index);

  return {
    borderInlineStartWidth: "3px",
    borderInlineStartStyle: "solid" as const,
    borderInlineStartColor: resolved,
    backgroundColor: `color-mix(in srgb, ${resolved} 11%, var(--surface))`,
    borderColor: `color-mix(in srgb, ${resolved} 24%, var(--border))`,
  };
}
