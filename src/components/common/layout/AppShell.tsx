"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { AuthBootstrap } from "@/components/common/layout/AuthBootstrap";
import { MobileAppShell } from "@/components/common/layout/MobileAppShell";

const PAGE_TITLES: Record<string, string> = {
  [PATHS.HOME]: "داشبورد",
  [PATHS.ANALYSIS]: "تحلیل مالی",
  [PATHS.BOXES]: "صندوق‌ها",
  [PATHS.CREATE_BUDGET]: "ثبت تراکنش",
  [PATHS.CATEGORIES]: "دسته‌بندی‌ها",
  [PATHS.DEBTS]: "طلب و بدهی",
  [PATHS.PROFILE]: "پروفایل",
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
  const title =
    (isBudgetEdit ? "ویرایش تراکنش" : PAGE_TITLES[pathname]) ?? "Paradise Budget";

  return (
    <>
      <AuthBootstrap />
      <MobileAppShell
        title={title}
        showBack={
          pathname !== PATHS.HOME &&
          pathname !== PATHS.BOXES &&
          pathname !== PATHS.CATEGORIES
        }
        hideTabBar={
          pathname === PATHS.CREATE_BUDGET ||
          pathname.startsWith("/budgets/") ||
          pathname === PATHS.ANALYSIS ||
          pathname === PATHS.DEBTS
        }
      >
        {children}
      </MobileAppShell>
    </>
  );
}
