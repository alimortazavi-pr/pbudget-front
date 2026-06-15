"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { AuthBootstrap } from "@/components/common/layout/AuthBootstrap";
import { MobileAppShell } from "@/components/common/layout/MobileAppShell";
import { TimelineAppShell } from "@/components/common/layout/TimelineAppShell";
import { useExperience } from "@/components/providers/ExperienceProvider";

const PAGE_TITLES: Record<string, string> = {
  [PATHS.HOME]: "داشبورد",
  [PATHS.ANALYSIS]: "تحلیل مالی",
  [PATHS.BOXES]: "صندوق‌ها",
  [PATHS.CREATE_BUDGET]: "ثبت تراکنش",
  [PATHS.CATEGORIES]: "دسته‌بندی‌ها",
  [PATHS.DEBTS]: "طلب و بدهی",
  [PATHS.INSTALLMENTS]: "اقساط",
  [PATHS.CHECKS]: "چک‌ها",
  [PATHS.NOTES]: "یادداشت‌ها",
  [PATHS.PROJECTS]: "پروژه‌ها",
  [PATHS.TASKS]: "برنامه روزانه",
  [PATHS.PROFILE]: "پروفایل",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { experienceMode, mounted } = useExperience();
  const isTimeline = mounted && experienceMode === "timeline";
  const isAuthPage = pathname === PATHS.GET_STARTED;

  if (isAuthPage) {
    return (
      <>
        <AuthBootstrap />
        {children}
      </>
    );
  }

  const isBudgetEdit = pathname.startsWith("/budgets/");
  const isProjectDetail = pathname.startsWith("/projects/");
  const title =
    (isBudgetEdit
      ? "ویرایش تراکنش"
      : isProjectDetail && pathname !== PATHS.PROJECTS
        ? "مدیریت پروژه"
        : pathname === PATHS.HOME && isTimeline
          ? "خط زمانی"
          : PAGE_TITLES[pathname]) ?? APP_NAME_FA;

  const shellProps = {
    title,
    showBack:
      pathname !== PATHS.HOME &&
      pathname !== PATHS.BOXES &&
      pathname !== PATHS.CATEGORIES &&
      pathname !== PATHS.PROFILE,
    hideTabBar:
      pathname === PATHS.CREATE_BUDGET ||
      pathname.startsWith("/budgets/") ||
      pathname === PATHS.ANALYSIS ||
      pathname === PATHS.DEBTS ||
      pathname === PATHS.INSTALLMENTS ||
      pathname === PATHS.CHECKS ||
      pathname === PATHS.NOTES ||
      pathname === PATHS.PROJECTS ||
      pathname === PATHS.TASKS ||
      pathname.startsWith("/projects/"),
    showPeriodBar: !(
      [PATHS.INSTALLMENTS, PATHS.CHECKS, PATHS.NOTES, PATHS.TASKS] as string[]
    ).includes(pathname),
  };

  return (
    <>
      <AuthBootstrap />
      {isTimeline ? (
        <TimelineAppShell {...shellProps}>{children}</TimelineAppShell>
      ) : (
        <MobileAppShell
          {...shellProps}
          showBack={
            pathname !== PATHS.HOME &&
            pathname !== PATHS.BOXES &&
            pathname !== PATHS.CATEGORIES
          }
        >
          {children}
        </MobileAppShell>
      )}
    </>
  );
}
