"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button, Switch } from "@heroui/react";
import { Radar, Refresh2 } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import type { AdminActivityResponse } from "@/common/interfaces/admin";
import { showErrorToast } from "@/common/utils/toast";
import { ActivityList } from "./AdminActivityFeed";
import { AdminPageHeader, AdminPanel, EmptyState, PaginationBar, SegmentedTabs, SkeletonRows } from "./ui/AdminUi";

type Mode = "actions" | "all" | "errors";

export function AdminLiveActivityPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("errors") ? "errors" : "actions");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [data, setData] = useState<AdminActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        setData(
          await insightsApi.fetchGlobalActivity({
            page,
            limit: 50,
            includeViews: mode === "all",
            errorsOnly: mode === "errors",
          }),
        );
      } catch (error) {
        if (!silent) showErrorToast(error, "دریافت فعالیت‌ها ناموفق بود");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [mode, page],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh || page !== 1) return;
    const timer = window.setInterval(() => void load(true), 15_000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, load, page]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="فعالیت زنده"
        description="جریان لحظه‌ای کارهایی که کاربران انجام می‌دهند. روی نام هر کاربر بزنید تا پرونده‌اش باز شود."
        icon={<Radar size={24} variant="Bold" />}
        actions={
          <>
            <label className="flex items-center gap-2 text-xs text-muted">
              <Switch size="sm" isSelected={autoRefresh} onChange={setAutoRefresh}>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
              به‌روزرسانی خودکار
            </label>
            <Button size="sm" variant="secondary" onPress={() => void load()}>
              <Refresh2 size={16} />
              تازه‌سازی
            </Button>
          </>
        }
      />

      <SegmentedTabs
        items={[
          { id: "actions" as const, label: "عملیات‌ها" },
          { id: "all" as const, label: "همه (با بازدید صفحات)" },
          { id: "errors" as const, label: "خطاها" },
        ]}
        value={mode}
        onChange={(next) => {
          setMode(next);
          setPage(1);
        }}
      />

      <AdminPanel bodyClassName="px-4 pb-4 sm:px-5">
        {loading && !data ? (
          <div className="py-4"><SkeletonRows rows={10} height="h-12" /></div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-6"><EmptyState icon={<Radar size={34} />} title={mode === "errors" ? "خطایی ثبت نشده 🎉" : "فعالیتی ثبت نشده"} /></div>
        ) : (
          <>
            <ActivityList items={data.items} />
            <PaginationBar pagination={data.pagination} onPage={setPage} />
          </>
        )}
      </AdminPanel>
    </div>
  );
}
