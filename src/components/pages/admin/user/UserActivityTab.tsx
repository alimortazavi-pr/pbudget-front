"use client";

import { useCallback, useEffect, useState } from "react";
import { Switch } from "@heroui/react";
import { Radar } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import type { AdminActivityResponse } from "@/common/interfaces/admin";
import { showErrorToast } from "@/common/utils/toast";
import { ActivityList } from "../AdminActivityFeed";
import { AdminPanel, EmptyState, NativeSelect, PaginationBar, SkeletonRows } from "../ui/AdminUi";

const FEATURES = [
  { value: "", label: "همه بخش‌ها" },
  { value: "transactions", label: "تراکنش‌ها" },
  { value: "debts", label: "طلب و بدهی" },
  { value: "installments", label: "اقساط" },
  { value: "checks", label: "چک‌ها" },
  { value: "boxes", label: "صندوق‌ها" },
  { value: "categories", label: "دسته‌بندی‌ها" },
  { value: "projects", label: "پروژه‌ها" },
  { value: "work_time", label: "حضور و ساعت کاری" },
  { value: "tasks", label: "برنامه روزانه" },
  { value: "notes", label: "یادداشت‌ها" },
  { value: "bank_import", label: "ورود از بانک" },
  { value: "profile", label: "پروفایل" },
  { value: "subscription", label: "اشتراک" },
];

export function UserActivityTab({ userId }: { userId: string }) {
  const [includeViews, setIncludeViews] = useState(false);
  const [feature, setFeature] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await insightsApi.fetchUserActivity(userId, { page, limit: 40, includeViews, feature }));
    } catch (error) {
      showErrorToast(error, "دریافت فعالیت‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }, [feature, includeViews, page, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminPanel
      title="تاریخچه فعالیت"
      description="هر کاری که کاربر در اپ، وب یا تلگرام انجام داده — تا ۹۰ روز گذشته"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <NativeSelect
            ariaLabel="بخش"
            className="w-44"
            value={feature}
            onChange={(value) => {
              setFeature(value);
              setPage(1);
            }}
            options={FEATURES}
          />
          <label className="flex items-center gap-2 text-xs text-muted">
            <Switch
              size="sm"
              isSelected={includeViews}
              onChange={(selected) => {
                setIncludeViews(selected);
                setPage(1);
              }}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
            نمایش بازدید صفحات
          </label>
        </div>
      }
      bodyClassName="px-4 pb-4 sm:px-5"
    >
      {loading && !data ? (
        <div className="py-4"><SkeletonRows rows={8} height="h-12" /></div>
      ) : !data || data.items.length === 0 ? (
        <div className="py-6">
          <EmptyState icon={<Radar size={34} />} title="فعالیتی ثبت نشده" description="فعالیت‌ها از زمان فعال شدن ثبت لاگ و تا ۹۰ روز نگهداری می‌شوند." />
        </div>
      ) : (
        <div className={loading ? "opacity-60" : ""}>
          <ActivityList items={data.items} showUser={false} />
          <PaginationBar pagination={data.pagination} onPage={setPage} />
        </div>
      )}
    </AdminPanel>
  );
}
