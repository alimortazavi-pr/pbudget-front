"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SearchNormal1 } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminAuditLog } from "@/common/interfaces/admin";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

const ACTION_LABELS: Record<string, string> = {
  "backup.run": t("auto.k41e56adf45"),
  "backup.import": t("auto.k07d24206a0"),
  "database.export.collection": t("auto.k644ee65e54"),
  "database.export.all": t("auto.k3125415944"),
  "database.import.collection": t("auto.kea458cc2d3"),
  "user.update": t("auto.k1f97b4acf6"),
  "user.set_admin": t("auto.kf20c777bea"),
  "user.delete": t("auto.k6dec7fba0c"),
  "user.restore": t("auto.k9f3f9800ce"),
  "content.budget.update": t("nav.editTransaction"),
  "content.category.update": t("categories.editCategory"),
  "content.project.update": t("projects.editProject"),
  "app.android.upload": t("auto.k893216cb73"),
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
      showToast(t("auto.k49b54a8f04"), "danger");
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
          <h3 className="text-lg font-bold">{t("auto.kd1d2fbf802")}</h3>
          <p className="text-sm text-muted">
            {t("auto.k77c4c90a80")}
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
              placeholder={t("auto.k132a1a1fb2")}
              className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <Button type="submit" variant="secondary">
            {t("common.filter")}
          </Button>
        </form>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k299c8c9aa7")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k65497ce419")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k0f0dff2dfc")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k66f403b6e5")}</th>
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
            {t("auto.k1a592f6b2d")}
          </Button>
          <span className="text-sm text-muted">
            {t("auto.k58210d64d8")}{toPersianDigits(page)} {t("common.of")} {toPersianDigits(totalPages)}
          </span>
          <Button
            variant="secondary"
            isDisabled={page >= totalPages}
            onPress={() => setPage((p) => p + 1)}
          >
            {t("auto.k54ee927e96")}
          </Button>
        </div>
      )}
    </div>
  );
}
