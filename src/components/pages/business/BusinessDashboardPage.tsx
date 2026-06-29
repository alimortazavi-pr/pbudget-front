"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";

import { PATHS } from "@/common/constants";
import * as businessApi from "@/common/api/business";
import type { IBusinessDashboardSummary } from "@/common/interfaces/business.interface";
import { formatPrice } from "@/common/utils/persian-digits";
import { showToast } from "@/common/utils/toast";
import { BusinessGeofenceSettings } from "@/components/pages/business/BusinessGeofenceSettings";
import { TransactionApprovalSettings } from "@/components/pages/business/TransactionApprovalSettings";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type BusinessDashboardPageProps = {
  businessId: string;
};

export function BusinessDashboardPage({ businessId }: BusinessDashboardPageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const [summary, setSummary] = useState<IBusinessDashboardSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const permissions = workspace?.permissions ?? [];
  const canViewDashboard = hasBusinessPermission(permissions, "dashboard.view");

  const load = useCallback(async () => {
    if (!canViewDashboard) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await businessApi.fetchBusinessDashboard(businessId);
      setSummary(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [businessId, canViewDashboard]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canViewDashboard) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی به داشبورد ندارید. از منوی بالا بخش مجاز را انتخاب کنید.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted">
        در حال بارگذاری…
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">درآمد</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">
            {formatPrice(summary.income)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">هزینه</p>
          <p className="mt-1 text-xl font-bold text-rose-600">
            {formatPrice(summary.cost)}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">مانده</p>
          <p className="mt-1 text-xl font-bold">{formatPrice(summary.balance)}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <p className="text-sm text-muted">تراکنش‌های ثبت‌شده</p>
        <p className="mt-1 text-2xl font-bold">{summary.transactionCount}</p>
        <p className="mt-1 text-sm text-muted">
          {summary.staffCount} پرسنل فعال
        </p>
      </div>

      {hasBusinessPermission(permissions, "settings.manage") ? (
        <>
          <BusinessGeofenceSettings
            businessId={businessId}
            initial={workspace?.settings?.geofence ?? null}
          />
          <TransactionApprovalSettings
            businessId={businessId}
            initialThreshold={
              workspace?.settings?.transactionApprovalThreshold ?? 0
            }
          />
        </>
      ) : null}

      {hasBusinessPermission(permissions, "staff.view") ? (
        <Link href={PATHS.BUSINESS_STAFF(businessId)}>
          <Button variant="secondary" className="w-full">
            مدیریت پرسنل
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
