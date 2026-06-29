"use client";

import { useCallback, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowRight2, Building } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as businessApi from "@/common/api/business";
import { storage } from "@/common/utils/storage";
import {
  BUSINESS_NAV_ITEMS,
} from "@/components/common/layout/shell-nav";
import {
  hasBusinessPermission,
  setActiveBusinessId,
  setWorkspaceContext,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { isAttendanceOnlyMode } from "@/common/utils/business-attendance";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import type { BusinessPermission } from "@/common/interfaces/business.interface";

function navHref(businessId: string, segment: string) {
  if (segment === "#dashboard") return PATHS.BUSINESS_DETAIL(businessId);
  return `/business/${businessId}/${segment}`;
}

export function BusinessWorkspaceLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const businessId = String(params.id ?? "");
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const workspace = useAppSelector(workspaceContextSelector);

  const loadContext = useCallback(async () => {
    if (!businessId) return;
    storage.setActiveBusinessId(businessId);
    dispatch(setActiveBusinessId(businessId));
    try {
      const ctx = await businessApi.fetchWorkspaceContext(businessId);
      dispatch(setWorkspaceContext(ctx));
    } catch {
      router.push(PATHS.BUSINESS);
    }
  }, [businessId, dispatch, router]);

  useEffect(() => {
    void loadContext();
    return () => {
      storage.setActiveBusinessId(null);
      dispatch(setActiveBusinessId(null));
    };
  }, [loadContext, dispatch]);

  const permissions = workspace?.permissions ?? [];
  const attendanceOnly =
    workspace?.attendanceOnly ?? isAttendanceOnlyMode(permissions);

  useEffect(() => {
    if (!workspace || !attendanceOnly) return;
    const onDashboard =
      pathname === PATHS.BUSINESS_DETAIL(businessId) ||
      pathname === `/business/${businessId}`;
    if (onDashboard) {
      router.replace(PATHS.BUSINESS_ATTENDANCE_ME(businessId));
    }
  }, [workspace, attendanceOnly, pathname, businessId, router]);

  const visibleNav = BUSINESS_NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    return hasBusinessPermission(
      permissions,
      item.permission as BusinessPermission,
    );
  });

  const title = workspace?.title ?? "کسب‌وکار";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-violet-600/10 px-4 py-2 text-center text-sm text-violet-800 dark:text-violet-200">
        <Building size={16} className="inline-block align-middle" />{" "}
        {attendanceOnly ? (
          <>
            حضور و غیاب —{" "}
            <span className="font-semibold">{title}</span>
          </>
        ) : (
          <>
            فضای کسب‌وکار: <span className="font-semibold">{title}</span>
            <Link
              href={PATHS.BUSINESS}
              className="mr-3 text-violet-700 underline dark:text-violet-300"
            >
              بازگشت به شخصی
            </Link>
          </>
        )}
      </div>

      {!attendanceOnly ? (
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="بازگشت"
              onPress={() => router.push(PATHS.BUSINESS)}
            >
              <ArrowRight2 size={20} />
            </Button>
            <h1 className="text-base font-semibold">{title}</h1>
          </div>
        </header>
      ) : (
        <header className="border-b border-border px-4 py-3 text-center">
          <h1 className="text-base font-semibold">{title}</h1>
        </header>
      )}

      {!attendanceOnly && visibleNav.length > 1 ? (
        <nav
          className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2"
          aria-label="ناوبری کسب‌وکار"
        >
          {visibleNav.map((item) => {
            const href = navHref(businessId, item.href);
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${
                  active
                    ? "bg-violet-600 text-white"
                    : "bg-surface-secondary text-muted"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      <main
        className={`px-4 py-5 ${attendanceOnly ? "pb-8" : "pb-24"}`}
      >
        {children}
      </main>
    </div>
  );
}
