import { Add, Box1, Category, Chart, Home2 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";

export const PRIMARY_NAV_ITEMS = [
  { href: PATHS.HOME, label: "خانه", icon: Home2 },
  { href: PATHS.ANALYSIS, label: "تحلیل مالی", icon: Chart },
  { href: PATHS.BOXES, label: "صندوق‌ها", icon: Box1 },
  { href: PATHS.CATEGORIES, label: "دسته‌بندی‌ها", icon: Category },
] as const;

export const CREATE_NAV_ITEM = {
  href: PATHS.CREATE_BUDGET,
  label: "ثبت تراکنش",
  icon: Add,
} as const;
