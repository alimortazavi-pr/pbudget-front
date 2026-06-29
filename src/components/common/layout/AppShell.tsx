"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { AuthBootstrap } from "@/components/common/layout/AuthBootstrap";
import { MobileAppShell } from "@/components/common/layout/MobileAppShell";
import { BalanceModalProvider } from "@/components/providers/BalanceModalProvider";
import { VoiceAssistantProvider } from "@/components/voice/VoiceAssistantProvider";

const PAGE_TITLES: Record<string, string> = {
  [PATHS.HOME]: "داشبورد",
  [PATHS.ANALYSIS]: "تحلیل مالی",
  [PATHS.BOXES]: "صندوق‌ها",
  [PATHS.CREATE_BUDGET]: "ثبت تراکنش",
  [PATHS.CATEGORIES]: "دسته‌بندی‌ها",
  [PATHS.DEBTS]: "طلب و بدهی",
  [PATHS.INSTALLMENTS]: "اقساط",
  [PATHS.CHECKS]: "چک‌ها",
  [PATHS.COMMITMENTS]: "تعهدات جاری",
  [PATHS.NOTES]: "یادداشت‌ها",
  [PATHS.PROJECTS]: "پروژه‌ها",
  [PATHS.TASKS]: "برنامه روزانه",
  [PATHS.PROFILE]: "پروفایل",
  [PATHS.SETTINGS]: "تنظیمات",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === PATHS.LANDING;
  const isLandingPreview = pathname === PATHS.LANDING_PREVIEW;
  const isPricingPage = pathname === PATHS.PRICING;
  const isAuthPage =
    pathname === PATHS.GET_STARTED ||
    pathname === PATHS.WORKSPACE ||
    pathname === PATHS.DOWNLOAD;

  if (isLandingPage || isLandingPreview || isPricingPage) {
    return (
      <>
        <AuthBootstrap />
        {children}
      </>
    );
  }
  const isAdminPage = pathname.startsWith("/admin");
  const isPublicInvitePage = pathname.startsWith("/partner-invite/");

  if (isAuthPage || isPublicInvitePage) {
    return (
      <>
        <AuthBootstrap />
        {children}
      </>
    );
  }

  if (isAdminPage) {
    return (
      <>
        <AuthBootstrap />
        {children}
      </>
    );
  }

  const isBudgetEdit = pathname.startsWith("/budgets/");
  const isProjectDetail = pathname.startsWith("/projects/");
  const isInstallmentDetail =
    pathname.startsWith("/installments/") && pathname !== PATHS.INSTALLMENTS;
  const isDebtDetail = pathname.startsWith("/debts/") && pathname !== PATHS.DEBTS;
  const title =
    (isBudgetEdit
      ? "ویرایش تراکنش"
      : isProjectDetail && pathname !== PATHS.PROJECTS
        ? "مدیریت پروژه"
        : isInstallmentDetail
          ? "برنامه پرداخت"
          : isDebtDetail
            ? "طلب و بدهی"
            : PAGE_TITLES[pathname]) ?? APP_NAME_FA;

  const shellProps = {
    title,
    showBack:
      pathname !== PATHS.HOME &&
      pathname !== PATHS.BOXES &&
      pathname !== PATHS.CATEGORIES &&
      pathname !== PATHS.PROFILE &&
      pathname !== PATHS.SETTINGS,
    hideTabBar:
      pathname === PATHS.CREATE_BUDGET ||
      pathname.startsWith("/budgets/") ||
      pathname === PATHS.ANALYSIS ||
      pathname === PATHS.DEBTS ||
      pathname === PATHS.INSTALLMENTS ||
      pathname === PATHS.CHECKS ||
      pathname === PATHS.COMMITMENTS ||
      pathname === PATHS.NOTES ||
      pathname === PATHS.PROJECTS ||
      pathname === PATHS.TASKS ||
      pathname === PATHS.SETTINGS ||
      pathname.startsWith("/projects/") ||
      isInstallmentDetail ||
      isDebtDetail,
  };

  return (
    <BalanceModalProvider>
      <VoiceAssistantProvider>
        <AuthBootstrap />
        <MobileAppShell
          {...shellProps}
          showBack={
            pathname !== PATHS.HOME &&
            pathname !== PATHS.BOXES &&
            pathname !== PATHS.CATEGORIES &&
            pathname !== PATHS.SETTINGS
          }
        >
          {children}
        </MobileAppShell>
      </VoiceAssistantProvider>
    </BalanceModalProvider>
  );
}
