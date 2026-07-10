"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Fragment, useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { SearchNormal1 } from "iconsax-reactjs";

import { fetchAdminVoiceLogs } from "@/common/api/voice";
import type { VoiceLog } from "@/common/interfaces/voice.interface";
import {
  VOICE_INTENT_LABELS,
  VOICE_STATUS_LABELS,
} from "@/common/interfaces/voice.interface";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

const STATUS_OPTIONS = [
  { value: "", label: "همه وضعیت‌ها" },
  { value: "pending", label: VOICE_STATUS_LABELS.pending },
  { value: "executed", label: VOICE_STATUS_LABELS.executed },
  { value: "failed", label: VOICE_STATUS_LABELS.failed },
  { value: "cancelled", label: VOICE_STATUS_LABELS.cancelled },
];

export function AdminVoiceLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<VoiceLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [intent, setIntent] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminVoiceLogs({ page, status, intent });
      setLogs(data.items);
      setTotalPages(data.pagination.totalPages);
    } catch {
      showToast(t("auto.kf556ae68a1"), "danger");
    } finally {
      setLoading(false);
    }
  }, [page, status, intent]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">{t("auto.kbe301b4fc3")}</h3>
        <p className="text-sm text-muted">
          تمام درخواست‌های تشخیص و اجرای دستورات صوتی (محیط تست)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="relative min-w-[200px] flex-1">
          <SearchNormal1
            size={18}
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={intent}
            onChange={(e) => {
              setPage(1);
              setIntent(e.target.value);
            }}
            placeholder={t("auto.k1a8ad7a277")}
            className="w-full rounded-xl border border-border bg-surface px-10 py-2.5 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k299c8c9aa7")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k883da9f030")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k38e921a220")}</th>
                <th className="px-4 py-3 text-start font-medium">Intent</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k2f3c6cf127")}</th>
                <th className="px-4 py-3 text-start font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    لاگی یافت نشد
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <Fragment key={log._id}>
                    <tr className="border-t border-border/40">
                      <td className="px-4 py-3 whitespace-nowrap text-muted">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("fa-IR")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">{log.userName}</td>
                      <td className="max-w-[240px] truncate px-4 py-3" title={log.transcript}>
                        {log.transcript}
                      </td>
                      <td className="px-4 py-3">
                        {VOICE_INTENT_LABELS[log.intent] ?? log.intent}
                      </td>
                      <td className="px-4 py-3">
                        {VOICE_STATUS_LABELS[log.status] ?? log.status}
                      </td>
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
                    {expandedId === log._id && (
                      <tr className="border-t border-border/20 bg-surface-secondary/30">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="grid gap-3 text-xs lg:grid-cols-2">
                            <div>
                              <p className="font-medium text-muted">{t("auto.kca6847cd66")}</p>
                              <pre className="mt-1 overflow-x-auto rounded-xl bg-surface p-3 text-[11px] leading-5">
                                {JSON.stringify(log.interpretation, null, 2)}
                              </pre>
                            </div>
                            <div>
                              <p className="font-medium text-muted">{t("auto.kaffc1120a3")}</p>
                              <pre className="mt-1 overflow-x-auto rounded-xl bg-surface p-3 text-[11px] leading-5">
                                {JSON.stringify(
                                  {
                                    executionResult: log.executionResult,
                                    errorMessage: log.errorMessage,
                                    confidence: log.confidence,
                                    ip: log.ip,
                                  },
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            isDisabled={page <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          >
            قبلی
          </Button>
          <span className="text-sm text-muted">
            صفحه {toPersianDigits(String(page))} از {toPersianDigits(String(totalPages))}
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
