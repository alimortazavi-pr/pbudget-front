"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  Add,
  ArrowRight2,
  InfoCircle,
  Menu,
} from "iconsax-reactjs";
import { useState, type ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useTour } from "@/components/providers/TourProvider";
import { AppDrawer } from "./AppDrawer";
import { ChangeAccountPopover } from "./ChangeAccountPopover";
import { ShellSidebar } from "./ShellSidebar";
import {
  CREATE_NAV_ITEM,
  MOBILE_TAB_SIDE_ITEMS,
  PRIMARY_NAV_ITEMS,
  SIMPLE_MOBILE_TAB_SIDE_ITEMS,
} from "./shell-nav";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { LanguageSelector } from "./LanguageSelector";
import { useAppMode } from "@/components/providers/AppModeProvider";

type MobileAppShellProps = {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideTabBar?: boolean;
};

const MOBILE_TAB_ITEMS = [
  PRIMARY_NAV_ITEMS[0],
  MOBILE_TAB_SIDE_ITEMS[0],
  { ...CREATE_NAV_ITEM, label: "nav.create", fab: true as const },
  MOBILE_TAB_SIDE_ITEMS[1],
  { href: "#more", label: "nav.more", icon: Menu, isMore: true as const },
];

const SIMPLE_MOBILE_TAB_ITEMS = [
  PRIMARY_NAV_ITEMS[0],
  SIMPLE_MOBILE_TAB_SIDE_ITEMS[0],
  { ...CREATE_NAV_ITEM, label: "nav.create", fab: true as const },
  SIMPLE_MOBILE_TAB_SIDE_ITEMS[1],
  { href: "#more", label: "nav.more", icon: Menu, isMore: true as const },
];

export function MobileAppShell({
  children,
  title = APP_NAME_FA,
  showBack = false,
  hideTabBar = false,
}: MobileAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { startOnboarding, startPageTour } = useTour();
  const { t } = useTranslation();
  const { isSimple } = useAppMode();
  const displayTitle = t(title);
  const tabItems = isSimple ? SIMPLE_MOBILE_TAB_ITEMS : MOBILE_TAB_ITEMS;

  return (
    <div className="min-h-screen w-full bg-background lg:flex lg:flex-row">
      <ShellSidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="pb-header-full lg:static lg:z-auto lg:border-b lg:bg-surface/80">
          <div className="pb-header-inner">
            <div className="flex min-w-0 items-center gap-2">
              {showBack ? (
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={t("common.back")}
                  onPress={() => router.back()}
                >
                  <ArrowRight2 size={20} />
                </Button>
              ) : (
                <div className="size-9 lg:hidden" />
              )}
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="truncate text-base font-semibold lg:text-xl">
                  {displayTitle}
                </h1>
                <span className="hidden shrink-0 rounded-full bg-rose-500/12 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 sm:inline">
                  {t("nav.personalDesk")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label={t("common.help")}
                data-tour="tour-button"
                onPress={() => {
                  if (pathname === PATHS.HOME) {
                    startOnboarding();
                  } else {
                    startPageTour();
                  }
                }}
              >
                <InfoCircle size={20} />
              </Button>
              <ChangeAccountPopover />
              <LanguageSelector />
              <div className="lg:hidden">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="pb-main-shell">
          <main
            className={`pb-main-content px-4 pt-14 ${
              hideTabBar ? "pb-8" : "pb-page-with-tabbar"
            } pb-page-enter lg:px-10 lg:pb-10 lg:pt-8`}
            data-tour="page-content"
          >
            {children}
          </main>
        </div>

        {!hideTabBar && (
          <nav
            className="pb-tab-bar lg:hidden"
            aria-label={t("common.mainNavigation")}
            data-tour="nav-tab-bar"
          >
            <div className="pb-tab-bar-inner">
              {tabItems.map((item) => {
                if ("fab" in item && item.fab) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative -top-4 flex flex-col items-center"
                      aria-label={t(item.label)}
                      data-tour="nav-create"
                    >
                      <span className="pb-fab">
                        <Add size={26} color="#fff" variant="Bold" />
                      </span>
                    </Link>
                  );
                }

                if ("isMore" in item && item.isMore) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      className="pb-nav-item"
                      data-active={drawerOpen ? "true" : "false"}
                      data-tour="nav-more"
                      onClick={() => setDrawerOpen(true)}
                    >
                      <item.icon size={22} variant="Bold" />
                      <span>{t(item.label)}</span>
                    </button>
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
                    <span>{t(item.label)}</span>
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
