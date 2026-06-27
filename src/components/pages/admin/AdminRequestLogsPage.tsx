"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SearchNormal1 } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminRequestLog } from "@/common/interfaces/admin";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AdminPagination } from "@/components/pages/admin/AdminPagination";

const METHOD_OPTIONS = [
  { value: "", label: "همه متدها" },
  { value: "GET", label: "GET" },
  { value: "POST", label: "POST" },
  { value: "PATCH", label: "PATCH" },
  { value: "PUT", label: "PUT" },
  { value: "DELETE", label: "DELETE" },
];

const STATUS_OPTIONS = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "200", label: "۲۰۰ موفق" },
  { value: "201", label: "۲۰۱ ایجاد" },
  { value: "400", label: "۴۰۰ خطای کاربر" },
  { value: "401", label: "۴۰۱ احراز هویت" },
  { value: "403", label: "۴۰۳ ممنوع" },
  { value: "404", label: "۴۰۴ یافت نشد" },
  { value: "500", label: "۵۰۰ خطای سرور" },
];

function methodBadgeClass(method: string) {
  switch (method) {
    case "GET":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "POST":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "PATCH":
    case "PUT":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200";
    case "DELETE":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300";
    default:
      return "bg-surface-secondary text-muted";
  }
}

function statusBadgeClass(statusCode: number | null) {
  if (!statusCode) return "bg-surface-secondary text-muted";
  if (statusCode < 300) return "bg-success/15 text-success-foreground";
  if (statusCode < 400) return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
  if (statusCode < 500) return "bg-warning/15 text-warning-foreground";
  return "bg-danger/15 text-danger";
}

function formatDuration(durationMs: number | null) {
  if (durationMs == null) return "—";
  if (durationMs < 1000) return `${toPersianDigits(durationMs)} ms`;
  return `${toPersianDigits((durationMs / 1000).toFixed(1))} s`;
}

function JsonBlock({ value }: { value: unknown }) {
  if (value == null) {
    return <p className="text-sm text-muted">—</p>;
  }

  return (
    <pre className="max-h-56 overflow-auto rounded-xl bg-surface-secondary/80 p-3 text-start text-xs leading-6">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function AdminRequestLogsPage() {
  const [logs, setLogs] = useState<AdminRequestLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [method, setMethod] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchRequestLogs({
        page,
        method,
        statusCode: statusCode ? Number(statusCode) : undefined,
        search,
      });
      setLogs(data.items);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      showToast("بارگذاری لاگ‌ها ناموفق بود", "danger");
    } finally {
      setLoading(false);
    }
  }, [page, method, statusCode, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">لاگ سیستم</h3>
          <p className="mt-1 text-sm text-muted">
            ثبت تمام درخواست‌های API — چه کسی چه مسیری را صدا زده و با چه
            نتیجه‌ای
          </p>
        </div>

        <form
          className="flex w-full max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(searchInput.trim());
          }}
        >
          <div className="relative min-w-0 flex-1">
            <SearchNormal1
              size={18}
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="جستجو در مسیر، کاربر، خطا…"
              className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            جستجو
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={method}
          onChange={(e) => {
            setPage(1);
            setMethod(e.target.value);
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={statusCode}
          onChange={(e) => {
            setPage(1);
            setStatusCode(e.target.value);
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">زمان</th>
                <th className="px-4 py-3 text-start font-medium">کاربر</th>
                <th className="px-4 py-3 text-start font-medium">متد</th>
                <th className="px-4 py-3 text-start font-medium">مسیر</th>
                <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                <th className="px-4 py-3 text-start font-medium">مدت</th>
                <th className="px-4 py-3 text-start font-medium">IP</th>
                <th className="px-4 py-3 text-start font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    لاگی یافت نشد
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <Fragment key={log._id}>
                    <tr className="border-t border-border/50 hover:bg-surface-secondary/40">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("fa-IR")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{log.userName ?? "مهمان"}</p>
                        {log.user ? (
                          <p className="font-mono text-xs text-muted">{log.user}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${methodBadgeClass(log.method)}`}
                        >
                          {log.method}
                        </span>
                      </td>
                      <td className="max-w-[280px] px-4 py-3">
                        <p className="truncate font-mono text-xs" title={log.path}>
                          {log.path}
                        </p>
                        {log.errorMessage ? (
                          <p className="mt-1 truncate text-xs text-danger">
                            {log.errorMessage}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-bold ${statusBadgeClass(log.statusCode)}`}
                        >
                          {log.statusCode != null
                            ? toPersianDigits(log.statusCode)
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
                        {formatDuration(log.durationMs)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{log.ip ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() =>
                            setExpandedId((prev) => (prev === log._id ? null : log._id))
                          }
                        >
                          {expandedId === log._id ? "بستن" : "جزئیات"}
                        </Button>
                      </td>
                    </tr>
                    {expandedId === log._id ? (
                      <tr className="border-t border-border/30 bg-surface-secondary/30">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <p className="mb-2 text-xs font-semibold text-muted">
                                Query
                              </p>
                              <JsonBlock value={log.query} />
                            </div>
                            <div>
                              <p className="mb-2 text-xs font-semibold text-muted">
                                Body
                              </p>
                              <JsonBlock value={log.body} />
                            </div>
                            <div className="lg:col-span-2">
                              <p className="mb-2 text-xs font-semibold text-muted">
                                User-Agent
                              </p>
                              <p className="rounded-xl bg-surface-secondary/80 px-3 py-2 text-xs text-muted">
                                {log.userAgent ?? "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        page={page}
        totalPages={totalPages}
        total={total}
        onPage={setPage}
      />
    </div>
  );
}
