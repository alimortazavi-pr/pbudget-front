"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SearchNormal1 } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminAuditLog } from "@/common/interfaces/admin";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

const ACTION_LABELS: Record<string, string> = {
  "backup.run": "اجرای بکاپ",
  "backup.import": "بازیابی ZIP",
  "database.export.collection": "خروجی کالکشن",
  "database.export.all": "خروجی کامل DB",
  "database.import.collection": "بازیابی کالکشن",
  "user.update": "ویرایش کاربر",
  "user.set_admin": "تغییر نقش ادمین",
  "user.delete": "حذف کاربر",
  "user.restore": "بازیابی کاربر",
  "content.budget.update": "ویرایش تراکنش",
  "content.category.update": "ویرایش دسته",
  "content.project.update": "ویرایش پروژه",
  "app.android.upload": "آپلود APK اندروید",
};

export function AdminAuditPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchAuditLogs({
        page,
        action: actionFilter,
      });
      setLogs(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch {
      showToast(t("بارگذاری لاگ‌ها ناموفق بود"), "danger");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">{t("لاگ عملیات ادمین")}</h3>
          <p className="text-sm text-muted">
            ثبت تمام عملیات حساس پنل مدیریت
          </p>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setActionFilter(actionInput.trim());
          }}
        >
          <div className="relative min-w-[220px]">
            <SearchNormal1
              size={18}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              placeholder={t("فیلتر action…")}
              className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            فیلتر
          </Button>
        </form>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("زمان")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("ادمین")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("عملیات")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("منبع")}</th>
                <th className="px-4 py-3 text-start font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    لاگی یافت نشد
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log._id}
                    className="border-t border-border/50 hover:bg-surface-secondary/40"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString("fa-IR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">{log.actorName}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-lg bg-accent/10 px-2 py-1 text-xs font-medium">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{log.resource}</p>
                      {log.resourceId && (
                        <p className="font-mono text-xs text-muted">{log.resourceId}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{log.ip ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            isDisabled={page <= 1}
            onPress={() => setPage((p) => p - 1)}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted">
            صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
          </span>
          <Button
            variant="secondary"
            isDisabled={page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            بعدی
          </Button>
        </div>
      )}
    </div>
  );
}
