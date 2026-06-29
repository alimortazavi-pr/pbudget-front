"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SearchNormal1, DocumentDownload } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminAuthAuditLog } from "@/common/interfaces/admin";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

const ACTION_LABELS: Record<string, string> = {
  "auth.register": "ثبت‌نام",
  "auth.login_password": "ورود با رمز",
  "auth.login_otp": "ورود با OTP",
  "auth.workspace_selected": "انتخاب فضای کار",
};

export function AdminAuthAuditPage() {
  const [logs, setLogs] = useState<AdminAuthAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchAuthAuditLogs({
        page,
        action: actionFilter,
      });
      setLogs(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch {
      showToast("بارگذاری لاگ‌های ورود ناموفق بود", "danger");
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
          <h3 className="text-lg font-bold">لاگ ورود و احراز هویت</h3>
          <p className="text-sm text-muted">
            ثبت‌نام، ورود و انتخاب فضای کاری کاربران
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
                placeholder="فیلتر action…"
                className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <Button type="submit" variant="secondary">
              فیلتر
            </Button>
          </form>
          <Button
            variant="secondary"
            onPress={() => {
              void adminApi
                .downloadAuthAuditExport({
                  action: actionFilter || undefined,
                })
                .catch(() => showToast("خروجی CSV ناموفق بود", "danger"));
            }}
          >
            <DocumentDownload size={18} />
            خروجی CSV
          </Button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">زمان</th>
                <th className="px-4 py-3 text-start font-medium">کاربر</th>
                <th className="px-4 py-3 text-start font-medium">عملیات</th>
                <th className="px-4 py-3 text-start font-medium">جزئیات</th>
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
                    <td className="px-4 py-3 whitespace-nowrap text-muted">
                      {log.createdAt
                        ? new Date(log.createdAt).toLocaleString("fa-IR")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{log.userName}</p>
                      {log.userMobile ? (
                        <p className="text-xs text-muted" dir="ltr">
                          {toPersianDigits(log.userMobile)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-xs text-muted">
                      {log.metadata?.path ? (
                        <span dir="ltr">{String(log.metadata.path)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{log.ip ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted">
            {toPersianDigits(String(page))} / {toPersianDigits(String(totalPages))}
          </span>
          <Button
            size="sm"
            variant="secondary"
            isDisabled={page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            بعدی
          </Button>
        </div>
      ) : null}
    </div>
  );
}
