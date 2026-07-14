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
  Mobile,
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

export const SIMPLE_NAV_ITEMS = [
  { href: PATHS.HOME, label: "nav.home", icon: Home2 },
  { href: PATHS.CATEGORIES, label: "nav.categories", icon: Category },
  { href: PATHS.BOXES, label: "nav.boxes", icon: Box1 },
] as const;

export const PRIMARY_NAV_ITEMS = [
  { href: PATHS.HOME, label: "nav.home", icon: Home2 },
  { href: PATHS.BANK_IMPORT, label: "nav.bankImport", icon: DocumentUpload },
  { href: PATHS.ANALYSIS, label: "nav.financialAnalysis", icon: Chart },
  { href: PATHS.BOXES, label: "nav.boxes", icon: Box1 },
  { href: PATHS.PAYMENT_CARDS, label: "nav.myCards", icon: Card },
  { href: PATHS.CATEGORIES, label: "nav.categories", icon: Category },
] as const;

/** Simple mobile tab bar — beside the center FAB */
export const SIMPLE_MOBILE_TAB_SIDE_ITEMS = [
  { href: PATHS.CATEGORIES, label: "nav.categoriesShort", icon: Category },
  { href: PATHS.BOXES, label: "nav.boxes", icon: Box1 },
] as const;

export const BANK_IMPORT_NAV_ITEM = {
  href: PATHS.BANK_IMPORT,
  label: "nav.bankImportFull",
  icon: DocumentUpload,
} as const;

export const DOWNLOAD_NAV_ITEM = {
  href: PATHS.DOWNLOAD,
  label: "nav.downloadApp",
  icon: Mobile,
} as const;

/** Classic mobile tab bar — beside the center FAB */
export const MOBILE_TAB_SIDE_ITEMS = [
  { href: PATHS.TASKS, label: "nav.dailyPlanner", icon: Task },
  { href: PATHS.NOTES, label: "nav.notes", icon: DocumentText },
] as const;

/** @deprecated flat list — use PLANNING_NAV_GROUPS */
export const PLANNING_NAV_ITEMS = [
  { href: PATHS.TASKS, label: "nav.dailyPlanner", icon: Task },
  { href: PATHS.PROJECTS, label: "nav.projects", icon: Briefcase },
  { href: PATHS.VENTURES, label: "nav.businessPartners", icon: Profile2User },
  { href: PATHS.WORK_ATTENDANCE, label: "nav.workAttendance", icon: Clock },
  { href: PATHS.DEBTS, label: "nav.debts", icon: Card },
  { href: PATHS.INSTALLMENTS, label: "nav.installments", icon: Calendar },
  { href: PATHS.CHECKS, label: "nav.checks", icon: MoneyRecive },
  { href: PATHS.COMMITMENTS, label: "nav.commitments", icon: Wallet },
  { href: PATHS.NOTES, label: "nav.notes", icon: DocumentText },
] as const;

export const PLANNING_NAV_GROUPS = [
  {
    title: "nav.planning",
    items: [
      { href: PATHS.TASKS, label: "nav.dailyPlanner", icon: Task },
      { href: PATHS.PROJECTS, label: "nav.projects", icon: Briefcase },
      { href: PATHS.NOTES, label: "nav.notes", icon: DocumentText },
    ],
  },
  {
    title: "nav.advancedFinance",
    items: [
      { href: PATHS.DEBTS, label: "nav.debts", icon: Card },
      { href: PATHS.INSTALLMENTS, label: "nav.installments", icon: Calendar },
      { href: PATHS.CHECKS, label: "nav.checks", icon: MoneyRecive },
      { href: PATHS.COMMITMENTS, label: "nav.commitments", icon: Wallet },
    ],
  },
  {
    title: "nav.partnership",
    items: [
      { href: PATHS.VENTURES, label: "nav.businessPartners", icon: Profile2User },
      { href: PATHS.WORK_ATTENDANCE, label: "nav.workAttendance", icon: Clock },
    ],
  },
] as const;

export const ACCOUNT_NAV_ITEMS = [
  { href: PATHS.PROFILE, label: "nav.profile", icon: Profile },
  { href: PATHS.SETTINGS, label: "nav.settings", icon: Setting2 },
  {
    href: getTelegramHref(),
    label: "nav.telegramBot",
    icon: Messages2,
    external: Boolean(TELEGRAM_BOT_USERNAME),
  },
] as const;

export const CREATE_NAV_ITEM = {
  href: PATHS.CREATE_BUDGET,
  label: "nav.createTransaction",
  icon: Add,
} as const;

export type ShellNavItem = {
  href: string;
  label: string;
  icon: (typeof PRIMARY_NAV_ITEMS)[number]["icon"];
  external?: boolean;
};

/** Paths that must not mark a parent nav item active (e.g. /projects vs /projects/attendance) */
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
