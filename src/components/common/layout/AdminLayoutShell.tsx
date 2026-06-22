"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ArrowRight2,
  Chart,
  LogoutCurve,
  ShieldTick,
} from "iconsax-reactjs";
import type { Icon } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import { AuthBootstrap } from "@/components/common/layout/AuthBootstrap";
import { ADMIN_NAV } from "@/components/common/layout/admin-nav";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { userSelector } from "@/stores/profile";
import { forceAuthLogout } from "@/common/utils/force-auth-logout";

function NavLink({
  href,
  label,
  icon: IconComponent,
}: {
  href: string;
  label: string;
  icon: Icon;
}) {
  const pathname = usePathname();
  const active =
    href === PATHS.ADMIN
      ? pathname === PATHS.ADMIN
      : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-accent/15 text-accent"
          : "text-muted hover:bg-surface-secondary hover:text-foreground"
      }`}
    >
      <IconComponent size={20} variant={active ? "Bold" : "Linear"} />
      {label}
    </Link>
  );
}

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuth = useAppSelector(isAuthSelector);
  const user = useAppSelector(userSelector);

  useEffect(() => {
    if (!isAuth) return;
    if (user && !user.isAdmin) {
      router.replace(PATHS.HOME);
    }
  }, [isAuth, user, router]);

  const pageTitle =
    ADMIN_NAV.find((item) =>
      item.href === PATHS.ADMIN
        ? pathname === PATHS.ADMIN
        : pathname.startsWith(item.href),
    )?.label ?? "پنل ادمین";

  if (!isAuth || !user?.isAdmin) {
    return (
      <>
        <AuthBootstrap />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="glass max-w-md rounded-3xl p-8 text-center">
            <ShieldTick size={48} className="mx-auto text-accent" variant="Bold" />
            <h1 className="mt-4 text-xl font-bold">دسترسی ادمین</h1>
            <p className="mt-2 text-sm text-muted">
              در حال بررسی دسترسی شما…
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AuthBootstrap />
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <aside className="hidden w-64 shrink-0 border-e border-border/60 bg-surface/50 p-4 lg:block">
            <div className="mb-8 px-2">
              <p className="text-xs font-medium text-muted">مدیریت سیستم</p>
              <h1 className="mt-1 text-lg font-bold">{APP_NAME_FA}</h1>
              <p className="mt-1 text-xs text-muted">پنل ادمین</p>
            </div>

            <nav className="space-y-1">
              {ADMIN_NAV.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </nav>

            <div className="mt-8 rounded-2xl border border-border/50 bg-surface-secondary/50 p-4">
              <div className="flex items-center gap-2 text-xs text-muted">
                <Chart size={16} />
                مانیتورینگ فعال
              </div>
              <p className="mt-2 text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-muted">{user.mobile}</p>
            </div>

            <div className="mt-4 space-y-1">
              <Link
                href={PATHS.HOME}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-secondary hover:text-foreground"
              >
                <ArrowRight2 size={20} />
                بازگشت به اپ
              </Link>
              <button
                type="button"
                onClick={() => forceAuthLogout()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-danger/10"
              >
                <LogoutCurve size={20} />
                خروج
              </button>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-xl lg:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted">پنل ادمین</p>
                  <h2 className="text-xl font-bold">{pageTitle}</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success-foreground">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  آنلاین
                </div>
              </div>
            </header>

            <main className="flex-1 p-4 lg:p-8">{children}</main>
          </div>
        </div>
      </div>
    </>
  );
}
