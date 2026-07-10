"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Add, Calendar, Category, Chart, Home2, Profile, Setting2 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { usePendingInvitesCount } from "@/common/hooks/usePendingInvitesCount";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { ShellAccountMenu } from "@/components/common/layout/ShellAccountMenu";
import { CREATE_NAV_ITEM, BANK_IMPORT_NAV_ITEM, PLANNING_NAV_ITEMS } from "@/components/common/layout/shell-nav";

const TIMELINE_PRIMARY = [
  { href: PATHS.HOME, label: "خط زمانی", icon: Calendar },
  { href: PATHS.ANALYSIS, label: "تحلیل", icon: Chart },
  { href: PATHS.CATEGORIES, label: "دسته‌ها", icon: Category },
  { href: PATHS.PROFILE, label: "تنظیمات", icon: Setting2 },
] as const;

export function TimelineSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { count: pendingInvitesCount } = usePendingInvitesCount();

  return (
    <aside className="pb-timeline-sidebar" aria-label={t("ناوبری timeline")}>
      <div className="flex h-full flex-col overflow-y-auto p-5 xl:p-6">
        <Link href={PATHS.HOME} className="mb-6 block px-2">
          <AppLogo />
        </Link>

        <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted">
          مرکز کنترل
        </p>
        <nav className="flex flex-col gap-0.5">
          {TIMELINE_PRIMARY.map((item) => {
            const active =
              item.href === PATHS.HOME
                ? pathname === PATHS.HOME
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="pb-sidebar-link"
                data-active={active ? "true" : "false"}
              >
                <item.icon size={20} variant={active ? "Bold" : "Linear"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href={CREATE_NAV_ITEM.href} className="pb-sidebar-cta mt-4">
          <Add size={20} variant="Bold" />
          {CREATE_NAV_ITEM.label}
        </Link>

        <Link href={BANK_IMPORT_NAV_ITEM.href} className="pb-sidebar-secondary-cta mt-2">
          <BANK_IMPORT_NAV_ITEM.icon size={18} variant="Bold" />
          {BANK_IMPORT_NAV_ITEM.label}
        </Link>

        <p className="mb-2 mt-6 px-3 text-xs font-semibold tracking-wide text-muted">
          ماژول‌ها
        </p>
        <nav className="flex flex-col gap-0.5">
          {PLANNING_NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            const badge =
              item.href === PATHS.VENTURES && pendingInvitesCount > 0
                ? pendingInvitesCount > 9
                  ? "9+"
                  : pendingInvitesCount
                : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="pb-sidebar-link"
                data-active={active ? "true" : "false"}
              >
                <item.icon size={20} variant={active ? "Bold" : "Linear"} />
                <span className="flex flex-1 items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {badge ? (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                      {badge}
                    </span>
                  ) : null}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border/50 pt-4">
          <ShellAccountMenu variant="sidebar" showPlanning={false} />
        </div>
      </div>
    </aside>
  );
}

export const TIMELINE_TAB_ITEMS = [
  { href: PATHS.HOME, label: "خانه", icon: Home2 },
  { href: PATHS.ANALYSIS, label: "تحلیل", icon: Chart },
  { href: CREATE_NAV_ITEM.href, label: "ثبت", icon: Add, fab: true as const },
  { href: PATHS.PROFILE, label: "تنظیمات", icon: Profile },
] as const;
