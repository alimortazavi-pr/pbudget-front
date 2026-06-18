"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Add, ArrowRight2, Menu } from "iconsax-reactjs";
import { Suspense, useState, type ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppDrawer } from "@/components/common/layout/AppDrawer";
import { ChangeAccountPopover } from "@/components/common/layout/ChangeAccountPopover";
import {
  TIMELINE_TAB_ITEMS,
  TimelineSidebar,
} from "@/components/common/layout/TimelineSidebar";
import { PeriodScopeBar } from "@/components/pages/timeline/PeriodScopeBar";
import { PeriodProvider } from "@/components/providers/PeriodProvider";

type TimelineAppShellProps = {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideTabBar?: boolean;
  showPeriodBar?: boolean;
};

export function TimelineAppShell({
  children,
  title = APP_NAME_FA,
  showBack = false,
  hideTabBar = false,
  showPeriodBar = true,
}: TimelineAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isHome = pathname === PATHS.HOME;

  return (
    <div className="min-h-screen w-full bg-background lg:flex lg:flex-row">
      <TimelineSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="pb-header-full lg:static lg:z-auto lg:border-b lg:bg-surface/80">
          <div className="pb-header-inner">
            <div className="flex min-w-0 items-center gap-2">
              {showBack ? (
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label="بازگشت"
                  onPress={() => router.back()}
                >
                  <ArrowRight2 size={20} />
                </Button>
              ) : (
                <div className="size-9 lg:hidden" />
              )}
              <h1 className="truncate text-base font-semibold lg:text-xl">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <ChangeAccountPopover />
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                className="lg:hidden"
                aria-label="منو"
                onPress={() => setDrawerOpen(true)}
              >
                <Menu size={20} />
              </Button>
              <div className="hidden lg:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="pb-main-shell">
          {showPeriodBar && !isHome && (
            <Suspense fallback={<div className="h-10 px-4 pt-14 lg:px-10 lg:pt-6" />}>
              <PeriodProvider>
                <div className="px-4 pt-14 lg:mx-auto lg:max-w-6xl lg:px-10 lg:pt-6">
                  <PeriodScopeBar compact />
                </div>
              </PeriodProvider>
            </Suspense>
          )}
          <main
            className={`pb-main-content px-4 ${
              isHome ? "pt-14" : showPeriodBar ? "pt-3" : "pt-14"
            } ${
              hideTabBar ? "pb-8" : "pb-page-with-tabbar"
            } pb-page-enter lg:px-10 lg:pb-10 lg:pt-8`}
          >
            {children}
          </main>
        </div>

        {!hideTabBar && (
          <nav className="pb-tab-bar lg:hidden" aria-label="ناوبری timeline">
            <div className="pb-tab-bar-inner">
              {TIMELINE_TAB_ITEMS.map((item) => {
                if ("fab" in item && item.fab) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative -top-4 flex flex-col items-center"
                      aria-label={item.label}
                    >
                      <span className="pb-fab">
                        <Add size={26} color="#fff" variant="Bold" />
                      </span>
                    </Link>
                  );
                }

                const active =
                  item.href === PATHS.HOME
                    ? pathname === PATHS.HOME
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="pb-nav-item"
                    data-active={active ? "true" : "false"}
                  >
                    <item.icon
                      size={22}
                      variant={active ? "Bold" : "Linear"}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      <AppDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
