"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { AuthBootstrap } from "@/components/common/layout/AuthBootstrap";
import { MobileAppShell } from "@/components/common/layout/MobileAppShell";
import { SimpleModeGuard } from "@/components/common/layout/SimpleModeGuard";
import { BalanceModalProvider } from "@/components/providers/BalanceModalProvider";
import { SubscriptionAccessProvider } from "@/components/providers/SubscriptionAccessProvider";

const PAGE_TITLE_KEYS: Record<string, string> = {
  [PATHS.HOME]: "nav.dashboard",
  [PATHS.ANALYSIS]: "nav.financialAnalysis",
  [PATHS.EXPORTS]: "nav.customExports",
  [PATHS.PLANS]: "nav.plans",
  [PATHS.BOXES]: "nav.boxes",
  [PATHS.PAYMENT_CARDS]: "nav.myCards",
  [PATHS.BANK_IMPORT]: "nav.bankImport",
  [PATHS.VENTURES]: "nav.businessPartners",
  [PATHS.WORK_ATTENDANCE]: "nav.workAttendance",
  [PATHS.INVITES]: "nav.invites",
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

/** Pages that live inside the signed-in app chrome (sidebar, header, tab bar). */
const APP_ROUTE_PREFIXES = [
  PATHS.HOME,
  PATHS.ANALYSIS,
  PATHS.EXPORTS,
  PATHS.PLANS,
  PATHS.BOXES,
  PATHS.PAYMENT_CARDS,
  PATHS.BANK_IMPORT,
  PATHS.VENTURES,
  PATHS.INVITES,
  PATHS.CREATE_BUDGET,
  "/budgets",
  PATHS.PROFILE,
  PATHS.SETTINGS,
  PATHS.DEBTS,
  PATHS.INSTALLMENTS,
  PATHS.CHECKS,
  PATHS.NOTES,
  PATHS.COMMITMENTS,
  PATHS.PROJECTS,
  PATHS.TASKS,
  PATHS.PLANNING,
];

function isAppRoute(pathname: string) {
  return APP_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AppShell({ children }: { children: ReactNode }) {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";
  const isLandingPage = pathname === PATHS.LANDING;
  const isLandingPreview = pathname === PATHS.LANDING_PREVIEW;
  const isPricingPage = pathname === PATHS.PRICING;
  const isAuthPage =
    pathname === PATHS.GET_STARTED ||
    pathname === PATHS.WORKSPACE ||
    pathname === PATHS.DOWNLOAD;

  // Default to the bare public page: an unknown or not-yet-known path must
  // never flash the signed-in chrome around the landing page.
  if (isLandingPage || isLandingPreview || isPricingPage || !isAppRoute(pathname)) {
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
      : isProjectDetail &&
          pathname !== PATHS.PROJECTS &&
          pathname !== PATHS.WORK_ATTENDANCE
        ? "nav.manageProject"
        : isInstallmentDetail
          ? "nav.paymentPlan"
          : isDebtDetail
            ? "nav.debts"
            : pathname.startsWith("/ventures/")
              ? "nav.businessPartners"
            : PAGE_TITLE_KEYS[pathname]) ?? APP_NAME_FA;

  const shellProps = {
    title: titleKey,
    showBack: pathname !== PATHS.HOME,
    hideTabBar:
      pathname === PATHS.CREATE_BUDGET ||
      pathname.startsWith("/budgets/") ||
      pathname === PATHS.ANALYSIS ||
      pathname === PATHS.EXPORTS ||
      pathname === PATHS.PLANS ||
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
      <AuthBootstrap />
      <SubscriptionAccessProvider>
        <MobileAppShell
          {...shellProps}
          showBack={pathname !== PATHS.HOME}
        >
          <SimpleModeGuard>{children}</SimpleModeGuard>
        </MobileAppShell>
      </SubscriptionAccessProvider>
    </BalanceModalProvider>
  );
}
