"use client";

import { Button, Spinner } from "@heroui/react";
import { Danger, InfoCircle, Refresh2 } from "iconsax-reactjs";

import type { ExportPreview } from "@/common/interfaces/export-center.interface";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { useTranslation } from "@/i18n";

const TONE: Record<string, string> = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "",
};

export function ExportPreviewPanel({
  preview,
  loading,
  error,
  blocked,
  onRefresh,
}: {
  preview: ExportPreview | null;
  loading: boolean;
  error: string | null;
  /** Why no preview can be shown (no source, locked source…). */
  blocked: string | null;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4" aria-live="polite" aria-busy={loading}>
      <header className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-bold">{t("exports.preview.title")}</h2>
          {preview && !blocked ? (
            <p className="mt-0.5 truncate text-xs text-muted">
              {preview.rangeLabel} · {t("exports.preview.rows", { count: toPersianDigits(preview.totalRows.toLocaleString("en-US")) })}
            </p>
          ) : null}
        </div>
        <Button size="sm" variant="ghost" onPress={onRefresh} isDisabled={Boolean(blocked) || loading} aria-label={t("exports.preview.refresh")}>
          {loading ? <Spinner size="sm" /> : <Refresh2 size={16} />}
          <span className="hidden sm:inline">{t("exports.preview.refresh")}</span>
        </Button>
      </header>

      {blocked ? (
        <p className="flex items-start gap-2 rounded-2xl bg-surface-secondary p-3 text-sm leading-6 text-muted">
          <InfoCircle size={18} className="mt-0.5 shrink-0" />
          {blocked}
        </p>
      ) : error ? (
        <div className="space-y-2 rounded-2xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          <p className="flex items-start gap-2 leading-6">
            <Danger size={18} className="mt-0.5 shrink-0" />
            {error}
          </p>
          <Button size="sm" variant="secondary" onPress={onRefresh}>
            {t("common.tryAgain")}
          </Button>
        </div>
      ) : !preview ? (
        <div className="space-y-2" aria-hidden>
          <div className="pb-shimmer h-16 rounded-2xl" />
          <div className="pb-shimmer h-40 rounded-2xl" />
        </div>
      ) : (
        <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {preview.sheets.map((sheet) => (
            <article key={sheet.key} className="space-y-3 rounded-2xl border border-border/60 bg-surface p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-bold">{sheet.label}</h3>
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
                  {t("exports.preview.rows", { count: toPersianDigits(sheet.matched.toLocaleString("en-US")) })}
                </span>
              </div>
              {sheet.truncated ? (
                <p className="rounded-xl bg-warning/15 p-2 text-xs leading-5 text-warning-foreground">
                  {t("exports.preview.truncated", {
                    exported: toPersianDigits(sheet.exported.toLocaleString("en-US")),
                    matched: toPersianDigits(sheet.matched.toLocaleString("en-US")),
                  })}
                </p>
              ) : null}
              {sheet.kpis.length > 1 ? (
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {sheet.kpis.slice(1, 7).map((kpi, index) => (
                    <div key={`${kpi.label}-${index}`} className="min-w-0 rounded-xl bg-surface-secondary px-2.5 py-2">
                      <dt className="truncate text-[11px] text-muted">{kpi.label}</dt>
                      <dd className={`truncate text-sm font-bold ${TONE[kpi.tone ?? "neutral"]}`} dir="auto">
                        {kpi.text}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {sheet.groups?.length ? (
                <p className="text-xs leading-6 text-muted">
                  {t("exports.preview.groups", { count: sheet.groups.length })}:{" "}
                  {sheet.groups
                    .slice(0, 5)
                    .map((group) => `${group.label} (${toPersianDigits(group.count)})`)
                    .join("، ")}
                </p>
              ) : null}
              {sheet.rows.length ? (
                <div className="-mx-1 overflow-x-auto overscroll-x-contain rounded-xl border border-border/50">
                  <table className="w-full min-w-max border-collapse text-start text-xs">
                    <caption className="sr-only">{t("exports.preview.caption", { name: sheet.label })}</caption>
                    <thead>
                      <tr className="bg-surface-secondary">
                        {sheet.columns.map((column) => (
                          <th key={column.key} scope="col" className="whitespace-nowrap px-2.5 py-2 text-start font-semibold">
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheet.rows.slice(0, 8).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-border/40">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="max-w-[14rem] truncate whitespace-nowrap px-2.5 py-1.5" title={cell}>
                              {cell || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="rounded-xl bg-surface-secondary p-3 text-center text-xs text-muted">{t("exports.preview.empty")}</p>
              )}
              {sheet.rows.length > 8 ? (
                <p className="text-[11px] text-muted">
                  {t("exports.preview.more", { count: toPersianDigits(Math.max(0, sheet.matched - 8).toLocaleString("en-US")) })}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
