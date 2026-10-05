"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight2,
  CloseCircle,
  HamburgerMenu,
  LogoutCurve,
  ShieldTick, SearchNormal1 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { AuthBootstrap } from "@/components/common/layout/AuthBootstrap";
import { ADMIN_NAV, ADMIN_NAV_GROUPS, type AdminNavItem } from "@/components/common/layout/admin-nav";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { CommandPalette, openCommandPalette } from "@/components/common/command/CommandPalette";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { useAppSelector } from "@/stores/hooks";
import { didTryAutoLoginSelector, isAuthSelector } from "@/stores/auth";
import { userSelector } from "@/stores/profile";
import { forceAuthLogout } from "@/common/utils/force-auth-logout";

function isActive(pathname: string, href: string) {
  return href === PATHS.ADMIN ? pathname === PATHS.ADMIN : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, onNavigate }: { item: AdminNavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const active = isActive(pathname, item.href);
  const IconComponent = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-accent/12 text-accent" : "text-muted hover:bg-surface-secondary hover:text-foreground"
      }`}
    >
      <IconComponent size={19} variant={active ? "Bold" : "Linear"} />
      {t(item.label)}
    </Link>
  );
}

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);

  return (
    <div className="flex h-full flex-col">
      <Link href={PATHS.ADMIN} onClick={onNavigate} className="mb-6 flex items-center gap-3 px-2">
        <AppLogo size={36} showText={false} />
        <div>
          <p className="text-sm font-bold">{APP_NAME_FA}</p>
          <p className="text-[11px] text-muted">{t("common.adminPanel")}</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-5 overflow-y-auto">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted/80">{t(group.title)}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 space-y-1 border-t border-border/50 pt-4">
        {user ? (
          <div className="mb-2 rounded-xl bg-surface-secondary/60 px-3 py-2.5">
            <p className="truncate text-sm font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted" dir="ltr">
              {user.mobile}
            </p>
          </div>
        ) : null}
        <Link
          href={PATHS.HOME}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:bg-surface-secondary hover:text-foreground"
        >
          <ArrowRight2 size={19} />
          {t("common.backToApp")}
        </Link>
        <button
          type="button"
          onClick={() => forceAuthLogout()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm text-danger hover:bg-danger/10"
        >
          <LogoutCurve size={19} />
          {t("common.logoutShort")}
        </button>
      </div>
    </div>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const isAuth = useAppSelector(isAuthSelector);
  const didTryAutoLogin = useAppSelector(didTryAutoLoginSelector);
  const user = useAppSelector(userSelector);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!didTryAutoLogin) return;
    if (!isAuth) {
      router.replace(`${PATHS.GET_STARTED}?return=${encodeURIComponent(pathname)}`);
      return;
    }
    if (user && !user.isAdmin) {
      router.replace(PATHS.HOME);
    }
  }, [didTryAutoLogin, isAuth, user, router, pathname]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const current = ADMIN_NAV.find((item) => isActive(pathname, item.href));
  const pageTitle = pathname.startsWith(`${PATHS.ADMIN_USERS}/`)
    ? t("nav.adminUserDetail")
    : t(current?.label ?? "common.adminPanel");

  const isCheckingAccess = !didTryAutoLogin || !isAuth || (isAuth && !user);

  if (isCheckingAccess || !user?.isAdmin) {
    if (didTryAutoLogin && isAuth && user && !user.isAdmin) {
      return null;
    }

    return (
      <>
        <AuthBootstrap />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="glass max-w-md rounded-3xl p-8 text-center">
            <ShieldTick size={48} className="mx-auto text-accent" variant="Bold" />
            <h1 className="mt-4 text-xl font-bold">{t("common.adminAccess")}</h1>
            <p className="mt-2 text-sm text-muted">{t("common.checkingAccess")}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthBootstrap />
      <div className="min-h-dvh bg-background">
        <div className="flex min-h-dvh">
          <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-e border-border/60 bg-surface/70 p-4 backdrop-blur-xl lg:block">
            <AdminNavigation />
          </aside>

          {drawerOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("common.adminPanel")}>
              <button
                type="button"
                aria-label={t("common.close")}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setDrawerOpen(false)}
              />
              <div className="absolute inset-y-0 start-0 flex w-[82%] max-w-xs flex-col bg-surface p-4 shadow-2xl">
                <button
                  type="button"
                  className="absolute end-3 top-3 cursor-pointer rounded-full p-1.5 text-muted hover:bg-surface-secondary"
                  onClick={() => setDrawerOpen(false)}
                  aria-label={t("common.close")}
                >
                  <CloseCircle size={22} />
                </button>
                <AdminNavigation onNavigate={() => setDrawerOpen(false)} />
              </div>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 px-4 py-3 backdrop-blur-xl lg:px-8">
              <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <button
                    type="button"
                    className="-ms-1 cursor-pointer rounded-xl p-2 text-foreground hover:bg-surface-secondary lg:hidden"
                    onClick={() => setDrawerOpen(true)}
                    aria-label={t("common.menu")}
                  >
                    <HamburgerMenu size={22} />
                  </button>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted">{t("common.adminPanel")}</p>
                    <h2 className="truncate text-base font-bold sm:text-lg">{pageTitle}</h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openCommandPalette}
                    aria-label={t("common.commandTitle")}
                    className="pb-press flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-surface-secondary/60 px-3 text-sm text-muted transition-colors hover:border-accent/40 hover:text-foreground sm:min-w-56"
                  >
                    <SearchNormal1 size={16} />
                    <span className="hidden flex-1 text-start sm:inline">{t("common.commandSearch")}</span>
                    <kbd className="hidden rounded-md border border-border/70 bg-surface px-1.5 text-[10px] sm:inline" dir="ltr">
                      Ctrl K
                    </kbd>
                  </button>
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 pb-10 lg:p-8">
              <div key={pathname} className="pb-route">
                {children}
              </div>
            </main>
            <CommandPalette />
          </div>
        </div>
      </div>
    </>
  );
}
