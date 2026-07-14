"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { AuthBootstrap } from "@/components/common/layout/AuthBootstrap";
import { MobileAppShell } from "@/components/common/layout/MobileAppShell";
import { SimpleModeGuard } from "@/components/common/layout/SimpleModeGuard";
import { BalanceModalProvider } from "@/components/providers/BalanceModalProvider";
import { useAppMode } from "@/components/providers/AppModeProvider";
import { VoiceAssistantProvider } from "@/components/voice/VoiceAssistantProvider";

const PAGE_TITLE_KEYS: Record<string, string> = {
  [PATHS.HOME]: "nav.dashboard",
  [PATHS.ANALYSIS]: "nav.financialAnalysis",
  [PATHS.BOXES]: "nav.boxes",
  [PATHS.CREATE_BUDGET]: "nav.createTransaction",
  [PATHS.CATEGORIES]: "nav.categories",
  [PATHS.DEBTS]: "nav.debts",
  [PATHS.INSTALLMENTS]: "nav.installments",
  [PATHS.CHECKS]: "nav.checks",
  [PATHS.COMMITMENTS]: "nav.commitments",
  [PATHS.NOTES]: "nav.notes",
  [PATHS.PROJECTS]: "nav.projects",
  [PATHS.TASKS]: "nav.dailyPlanner",
  [PATHS.PROFILE]: "nav.profile",
  [PATHS.SETTINGS]: "nav.settings",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isSimple } = useAppMode();
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
  const titleKey =
    (isBudgetEdit
      ? "nav.editTransaction"
      : isProjectDetail && pathname !== PATHS.PROJECTS
        ? "nav.manageProject"
        : isInstallmentDetail
          ? "nav.paymentPlan"
          : isDebtDetail
            ? "nav.debts"
            : isSimple && pathname === PATHS.HOME
              ? "nav.home"
              : PAGE_TITLE_KEYS[pathname]) ?? APP_NAME_FA;

  const shellProps = {
    title: titleKey,
    showBack: pathname !== PATHS.HOME,
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
      isDebtDetail ||
      (isSimple &&
        (pathname === PATHS.BOXES ||
          pathname === PATHS.CATEGORIES ||
          pathname === PATHS.SETTINGS)),
  };

  return (
    <BalanceModalProvider>
      <VoiceAssistantProvider>
        <AuthBootstrap />
        <MobileAppShell
          {...shellProps}
          showBack={pathname !== PATHS.HOME}
        >
          <SimpleModeGuard>{children}</SimpleModeGuard>
        </MobileAppShell>
      </VoiceAssistantProvider>
    </BalanceModalProvider>
  );
}
