"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import {
  Add,
  ArrowRight2,
  Menu,
} from "iconsax-reactjs";
import { useState, type ReactNode } from "react";

import { PATHS } from "@/common/constants";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppDrawer } from "./AppDrawer";
import { ChangeAccountPopover } from "./ChangeAccountPopover";
import { ShellSidebar } from "./ShellSidebar";
import { CREATE_NAV_ITEM, PRIMARY_NAV_ITEMS } from "./shell-nav";

type MobileAppShellProps = {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  hideTabBar?: boolean;
};

const MOBILE_TAB_ITEMS = [
  PRIMARY_NAV_ITEMS[0],
  PRIMARY_NAV_ITEMS[1],
  { ...CREATE_NAV_ITEM, label: "ثبت", fab: true as const },
  PRIMARY_NAV_ITEMS[2],
  { href: "#more", label: "بیشتر", icon: Menu, isMore: true as const },
];

export function MobileAppShell({
  children,
  title = "Paradise Budget",
  showBack = false,
  hideTabBar = false,
}: MobileAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          >
            {children}
          </main>
        </div>

        {!hideTabBar && (
          <nav className="pb-tab-bar lg:hidden" aria-label="ناوبری اصلی">
            <div className="pb-tab-bar-inner">
              {MOBILE_TAB_ITEMS.map((item) => {
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

                if ("isMore" in item && item.isMore) {
                  return (
                    <button
                      key={item.href}
                      type="button"
                      className="pb-nav-item"
                      data-active={drawerOpen ? "true" : "false"}
                      onClick={() => setDrawerOpen(true)}
                    >
                      <item.icon size={22} variant="Bold" />
                      <span>{item.label}</span>
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
