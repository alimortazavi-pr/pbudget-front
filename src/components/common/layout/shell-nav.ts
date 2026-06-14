import {
  Add,
  Box1,
  Briefcase,
  Calendar,
  Card,
  Category,
  Chart,
  Task,
  DocumentText,
  Home2,
  Messages2,
  MoneyRecive,
  Profile,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";

export const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? "";

export const SUPPORT_PHONE = "tel:09125519818";

export function getTelegramHref() {
  return TELEGRAM_BOT_USERNAME
    ? `https://t.me/${TELEGRAM_BOT_USERNAME}`
    : `${PATHS.PROFILE}#telegram`;
}

export const PRIMARY_NAV_ITEMS = [
  { href: PATHS.HOME, label: "خانه", icon: Home2 },
  { href: PATHS.ANALYSIS, label: "تحلیل مالی", icon: Chart },
  { href: PATHS.BOXES, label: "صندوق‌ها", icon: Box1 },
  { href: PATHS.CATEGORIES, label: "دسته‌بندی‌ها", icon: Category },
] as const;

export const PLANNING_NAV_ITEMS = [
  { href: PATHS.TASKS, label: "برنامه روزانه", icon: Task },
  { href: PATHS.PROJECTS, label: "پروژه‌ها", icon: Briefcase },
  { href: PATHS.DEBTS, label: "طلب و بدهی", icon: Card },
  { href: PATHS.INSTALLMENTS, label: "اقساط", icon: Calendar },
  { href: PATHS.CHECKS, label: "چک‌ها", icon: MoneyRecive },
  { href: PATHS.NOTES, label: "یادداشت‌ها", icon: DocumentText },
] as const;

export const ACCOUNT_NAV_ITEMS = [
  { href: PATHS.PROFILE, label: "پروفایل", icon: Profile },
  {
    href: getTelegramHref(),
    label: "بات تلگرام",
    icon: Messages2,
    external: Boolean(TELEGRAM_BOT_USERNAME),
  },
] as const;

export const CREATE_NAV_ITEM = {
  href: PATHS.CREATE_BUDGET,
  label: "ثبت تراکنش",
  icon: Add,
} as const;

export type ShellNavItem = {
  href: string;
  label: string;
  icon: (typeof PRIMARY_NAV_ITEMS)[number]["icon"];
  external?: boolean;
};
