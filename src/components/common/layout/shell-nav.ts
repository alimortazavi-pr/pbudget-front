import {
  Add,
  Box1,
  Briefcase,
  Calendar,
  Card,
  Category,
  Chart,
  DocumentUpload,
  Task,
  Clock,
  DocumentText,
  Home2,
  Messages2,
  MoneyRecive,
  Profile,
  Profile2User,
  Setting2,
  Wallet,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";

export const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? "";

export const SUPPORT_PHONE = "tel:09125519818";

export function getTelegramHref() {
  return TELEGRAM_BOT_USERNAME
    ? `https://t.me/${TELEGRAM_BOT_USERNAME}`
    : `${PATHS.SETTINGS}#telegram`;
}

export const PRIMARY_NAV_ITEMS = [
  { href: PATHS.HOME, label: "خانه", icon: Home2 },
  { href: PATHS.BANK_IMPORT, label: "ورود از بانک", icon: DocumentUpload },
  { href: PATHS.ANALYSIS, label: "تحلیل مالی", icon: Chart },
  { href: PATHS.BOXES, label: "صندوق‌ها", icon: Box1 },
  { href: PATHS.PAYMENT_CARDS, label: "کارت‌های من", icon: Card },
  { href: PATHS.CATEGORIES, label: "دسته‌بندی‌ها", icon: Category },
] as const;

export const BANK_IMPORT_NAV_ITEM = {
  href: PATHS.BANK_IMPORT,
  label: "ورود از صورتحساب بانک",
  icon: DocumentUpload,
} as const;

/** Classic mobile tab bar — beside the center FAB */
export const MOBILE_TAB_SIDE_ITEMS = [
  { href: PATHS.TASKS, label: "برنامه روزانه", icon: Task },
  { href: PATHS.NOTES, label: "یادداشت‌ها", icon: DocumentText },
] as const;

/** @deprecated flat list — use PLANNING_NAV_GROUPS */
export const PLANNING_NAV_ITEMS = [
  { href: PATHS.TASKS, label: "برنامه روزانه", icon: Task },
  { href: PATHS.PROJECTS, label: "پروژه‌ها", icon: Briefcase },
  { href: PATHS.VENTURES, label: "کسب‌وکار و شرکا", icon: Profile2User },
  { href: PATHS.WORK_ATTENDANCE, label: "حضور و غیاب", icon: Clock },
  { href: PATHS.DEBTS, label: "طلب و بدهی", icon: Card },
  { href: PATHS.INSTALLMENTS, label: "اقساط", icon: Calendar },
  { href: PATHS.CHECKS, label: "چک‌ها", icon: MoneyRecive },
  { href: PATHS.COMMITMENTS, label: "تعهدات جاری", icon: Wallet },
  { href: PATHS.NOTES, label: "یادداشت‌ها", icon: DocumentText },
] as const;

export const PLANNING_NAV_GROUPS = [
  {
    title: "برنامه‌ریزی",
    items: [
      { href: PATHS.TASKS, label: "برنامه روزانه", icon: Task },
      { href: PATHS.PROJECTS, label: "پروژه‌ها", icon: Briefcase },
      { href: PATHS.NOTES, label: "یادداشت‌ها", icon: DocumentText },
    ],
  },
  {
    title: "مالی پیشرفته",
    items: [
      { href: PATHS.DEBTS, label: "طلب و بدهی", icon: Card },
      { href: PATHS.INSTALLMENTS, label: "اقساط", icon: Calendar },
      { href: PATHS.CHECKS, label: "چک‌ها", icon: MoneyRecive },
      { href: PATHS.COMMITMENTS, label: "تعهدات جاری", icon: Wallet },
    ],
  },
  {
    title: "کسب‌وکار",
    items: [
      { href: PATHS.BUSINESS, label: "کسب‌وکارهای من", icon: Profile2User },
      { href: PATHS.VENTURES, label: "شرکا و تسویه", icon: Briefcase },
      { href: PATHS.WORK_ATTENDANCE, label: "حضور فریلنسری", icon: Clock },
    ],
  },
] as const;

export type BusinessNavItem = {
  href: string;
  label: string;
  icon: typeof Home2;
  permission?: import("@/common/interfaces/business.interface").BusinessPermission;
};

export const BUSINESS_NAV_ITEMS: BusinessNavItem[] = [
  {
    href: "#dashboard",
    label: "داشبورد",
    icon: Home2,
    permission: "dashboard.view",
  },
  {
    href: "transactions",
    label: "تراکنش‌ها",
    icon: Wallet,
    permission: "transactions.view",
  },
  {
    href: "staff",
    label: "پرسنل",
    icon: Profile2User,
    permission: "staff.view",
  },
  {
    href: "attendance",
    label: "حضور تیم",
    icon: Clock,
    permission: "attendance.view_team",
  },
  {
    href: "attendance/me",
    label: "حضور من",
    icon: Clock,
    permission: "attendance.self_clock",
  },
  {
    href: "attendance/shifts",
    label: "شیفت‌ها",
    icon: Clock,
    permission: "attendance.manage_shifts",
  },
  {
    href: "attendance/reports",
    label: "گزارش حضور",
    icon: Clock,
    permission: "attendance.reports",
  },
  {
    href: "finance",
    label: "مدیریت مالی",
    icon: Wallet,
    permission: "categories.manage",
  },
  {
    href: "petty-cash",
    label: "تنخواه",
    icon: MoneyRecive,
    permission: "petty_cash.hold",
  },
];

export const ACCOUNT_NAV_ITEMS = [
  { href: PATHS.PROFILE, label: "پروفایل", icon: Profile },
  { href: PATHS.SETTINGS, label: "تنظیمات", icon: Setting2 },
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

/** مسیرهایی که نباید والد را active کنند (مثلاً /projects نسبت به /projects/attendance) */
const NAV_ACTIVE_EXCLUSIONS: Record<string, readonly string[]> = {
  [PATHS.PROJECTS]: [PATHS.WORK_ATTENDANCE],
};

export function isShellNavActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  if (href === PATHS.HOME) return pathname === PATHS.HOME;
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;

  const exclusions = NAV_ACTIVE_EXCLUSIONS[href];
  if (
    exclusions?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }

  return true;
}
