import {
  DEFAULT_CATEGORY_COLORS,
  isValidHexColor,
  resolveCategoryColor,
} from "@/common/constants/category-colors";

export function resolveBoardColumnColor(color?: string | null, index = 0) {
  return resolveCategoryColor(color, index);
}

export function hexWithAlpha(hex: string, alpha: number) {
  if (!isValidHexColor(hex)) {
    return `rgba(148, 163, 184, ${alpha})`;
  }
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function boardColumnSurfaceStyle(color?: string | null, index = 0) {
  const resolved = resolveBoardColumnColor(color, index);
  return {
    backgroundColor: hexWithAlpha(resolved, 0.14),
    borderColor: hexWithAlpha(resolved, 0.32),
  };
}

export function boardCardSurfaceStyle(color?: string | null, index = 0) {
  const resolved = resolveBoardColumnColor(color, index);
  return {
    backgroundColor: hexWithAlpha(resolved, 0.22),
    borderColor: hexWithAlpha(resolved, 0.28),
  };
}

export const BOARD_COLUMN_COLORS = DEFAULT_CATEGORY_COLORS;
