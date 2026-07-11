"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SearchNormal1, DocumentDownload } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminAuthAuditLog } from "@/common/interfaces/admin";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

const ACTION_LABELS: Record<string, string> = {
  "auth.register": t("auto.kfc4a4f4fb0"),
  "auth.login_password": t("auto.k1441d8b7c1"),
  "auth.login_otp": t("auto.k7fb1dd26ea"),
  "auth.workspace_selected": t("auto.kd1385a659e"),
};

export function AdminAuthAuditPage() {
  const { t } = useTranslation();
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
      showToast(t("auto.kb0699c2cd2"), "danger");
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
          <h3 className="text-lg font-bold">{t("auto.k3c9ab3d59b")}</h3>
          <p className="text-sm text-muted">
            {t("auto.ke37d626a36")}
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
                placeholder={t("auto.k132a1a1fb2")}
                className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <Button type="submit" variant="secondary">
              {t("common.filter")}
            </Button>
          </form>
          <Button
            variant="secondary"
            onPress={() => {
              void adminApi
                .downloadAuthAuditExport({
                  action: actionFilter || undefined,
                })
                .catch(() => showToast(t("auto.k294ffedea9"), "danger"));
            }}
          >
            <DocumentDownload size={18} />
            {t("auto.k8189d2d717")}
          </Button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k299c8c9aa7")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k883da9f030")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k0f0dff2dfc")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.kd65b37fd31")}</th>
                <th className="px-4 py-3 text-start font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    {t("common.loading")}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    {t("auto.kca6941ce84")}
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
            {t("auto.k1a592f6b2d")}
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
            {t("auto.k54ee927e96")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
