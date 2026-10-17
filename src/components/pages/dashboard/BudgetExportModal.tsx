"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { ArrowLeft, Crown, DocumentDownload, DocumentText, Export, Lock1, Printer, TableDocument } from "iconsax-reactjs";

import * as exportApi from "@/common/api/export-center";
import { PATHS } from "@/common/constants";
import type { BudgetDuration } from "@/common/api/budgets";
import type { ExportFormat, ExportPreview, ExportRequest } from "@/common/interfaces/export-center.interface";
import type { ICategory } from "@/common/interfaces/category.interface";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { GREGORIAN_MONTHS } from "@/common/utils/calendar-date";
import { getJalaliDaysInMonth, JALALI_MONTHS } from "@/common/utils/jalali-date";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showToast } from "@/common/utils/toast";
import { flagList, type TransactionFilters } from "@/common/utils/transaction-filters";
import { AppSelect } from "@/components/common/form/AppControls";
import { FormCategoryComboBox, FormDatePicker } from "@/components/common/form/FormFields";
import { SwitchRow } from "@/components/common/form/FormKit";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Period = "daily" | "monthly" | "yearly" | "all" | "custom";

type BudgetExportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ICategory[];
  initialCategory: string;
  initialYear: string;
  initialMonth: string;
  initialDay: string;
  initialDuration?: BudgetDuration;
  /** The dashboard's search / filter panel (URL state), applied when asked. */
  dashboardFilters?: TransactionFilters;
};

function daysInMonth(year: number, month: number, gregorian: boolean) {
  if (!gregorian) return getJalaliDaysInMonth(year, month);
  return new Date(year, month, 0).getDate();
}

/** The dashboard export: one clear period, the dashboard's filters, three formats. */
export function BudgetExportModal({
  open,
  onOpenChange,
  categories,
  initialCategory,
  initialYear,
  initialMonth,
  initialDay,
  initialDuration = "monthly",
  dashboardFilters,
}: BudgetExportModalProps) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const access = useSubscriptionAccess();
  // Until the plan has loaded, assume access; the server checks again anyway.
  const quickAllowed = !access.data || access.isFeatureEnabled("quick_export");
  const advancedAllowed = !access.data || access.isFeatureEnabled("export_center");
  const calendar = user?.preferences?.dateCalendar === "gregorian" ? "gregorian" : "jalali";
  const gregorian = calendar === "gregorian";
  const hasDashboardRange = Boolean(dashboardFilters?.from || dashboardFilters?.to);

  const [period, setPeriod] = useState<Period>("monthly");
  const [date, setDate] = useState({ year: initialYear, month: initialMonth, day: initialDay });
  const [range, setRange] = useState({ from: "", to: "" });
  const [category, setCategory] = useState(initialCategory);
  const [useFilters, setUseFilters] = useState(true);
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [previewState, setPreviewState] = useState<"idle" | "loading" | "error">("idle");
  const [busy, setBusy] = useState<null | "download" | "open">(null);

  // Every time it opens, start from what the dashboard is showing right now.
  useEffect(() => {
    if (!open) return;
    setPeriod(hasDashboardRange ? "custom" : initialDuration);
    setDate({ year: initialYear, month: initialMonth, day: initialDay });
    setRange({ from: dashboardFilters?.from ?? "", to: dashboardFilters?.to ?? "" });
    setCategory(initialCategory);
    setUseFilters(true);
    setPreview(null);
  }, [open, hasDashboardRange, initialDuration, initialYear, initialMonth, initialDay, initialCategory, dashboardFilters?.from, dashboardFilters?.to]);

  const categoryOptions = useMemo(() => getCategorySelectOptions(categories), [categories]);

  const extraFilters = useMemo(() => {
    const f = dashboardFilters;
    if (!f) return [] as string[];
    const list: string[] = [];
    if (f.q) list.push(t("exports.quick.filterSearch", { q: f.q }));
    if (f.type) list.push(f.type === "0" ? t("exports.quick.filterIncome") : t("exports.quick.filterExpense"));
    if (f.min || f.max) list.push(t("exports.quick.filterAmount"));
    if (f.card) list.push(t("exports.quick.filterCard"));
    if (f.project) list.push(t("exports.quick.filterProject"));
    if (f.flags) list.push(...flagList(f.flags).map(() => t("exports.quick.filterFlag")));
    return Array.from(new Set(list));
  }, [dashboardFilters, t]);

  const request = useMemo<ExportRequest | null>(() => {
    const year = Number(date.year);
    const month = Number(date.month);
    let exportRange: ExportRequest["range"];
    if (period === "all") exportRange = { preset: "all" };
    else if (period === "custom") {
      if (!range.from && !range.to) return null;
      exportRange = { preset: "custom", ...(range.from ? { from: range.from } : {}), ...(range.to ? { to: range.to } : {}) };
    } else if (!year) return null;
    else if (period === "yearly")
      exportRange = { preset: "custom", from: `${year}-1-1`, to: `${year}-12-${daysInMonth(year, 12, gregorian)}` };
    else if (!month) return null;
    else if (period === "monthly")
      exportRange = { preset: "custom", from: `${year}-${month}-1`, to: `${year}-${month}-${daysInMonth(year, month, gregorian)}` };
    else {
      if (!date.day) return null;
      exportRange = { preset: "custom", from: `${year}-${month}-${date.day}`, to: `${year}-${month}-${date.day}` };
    }

    const f = useFilters ? dashboardFilters : undefined;
    const min = f?.min ? Number(f.min.replace(/[,\s]/g, "")) : undefined;
    const max = f?.max ? Number(f.max.replace(/[,\s]/g, "")) : undefined;
    const sort =
      f?.sort === "oldest"
        ? { field: "date", dir: "asc" as const }
        : f?.sort === "highest"
          ? { field: "amount", dir: "desc" as const }
          : f?.sort === "lowest"
            ? { field: "amount", dir: "asc" as const }
            : { field: "date", dir: "desc" as const };
    return {
      sources: [
        {
          key: "transactions",
          columns: ["date", "type", "amount", "category", "description", "card"],
          sort,
          filters: {
            ...(category ? { categories: [category], includeSubcategories: true } : {}),
            ...(f?.type === "0" ? { type: "income" } : f?.type === "1" ? { type: "expense" } : {}),
            ...(Number.isFinite(min) ? { min } : {}),
            ...(Number.isFinite(max) ? { max } : {}),
            ...(f?.card ? { cards: [f.card] } : {}),
            ...(f?.project ? { projects: [f.project] } : {}),
            ...(f?.flags ? { flags: flagList(f.flags) } : {}),
            ...(f?.q ? { q: f.q } : {}),
          },
        },
      ],
      range: exportRange,
      options: { calendar, includeSummary: true, includeTotals: true },
    };
  }, [calendar, category, dashboardFilters, date, gregorian, period, range, useFilters]);

  const requestKey = JSON.stringify(request);

  // How many rows the file will have, before downloading anything.
  useEffect(() => {
    if (!open || !request || !quickAllowed) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPreviewState("loading");
      exportApi
        .fetchExportPreview(request, controller.signal)
        .then((result) => {
          setPreview(result);
          setPreviewState("idle");
        })
        .catch(() => {
          if (!controller.signal.aborted) setPreviewState("error");
        });
    }, 400);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // requestKey covers every input of `request`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, requestKey, quickAllowed]);

  async function run(mode: "download" | "open") {
    if (!request) {
      showToast(t("exports.quick.pickPeriod"), "warning");
      return;
    }
    const pending = mode === "open" ? window.open("", "_blank") : null;
    setBusy(mode);
    try {
      const file = await exportApi.downloadExportFile(request, mode === "open" ? "html" : format);
      if (pending) pending.location.href = URL.createObjectURL(new Blob([file.blob], { type: "text/html" }));
      else exportApi.saveExportFile(file);
      showToast(mode === "open" ? t("dashboard.exportPreviewSuccess") : t("dashboard.exportDownloadSuccess"), "success");
      if (mode === "download") onOpenChange(false);
    } catch (error) {
      pending?.close();
      showToast(error instanceof Error ? error.message : t("dashboard.exportFetchError"));
    } finally {
      setBusy(null);
    }
  }

  const sheet = preview?.sheets[0];
  const kpis = sheet?.kpis.filter((kpi) => kpi.kind === "money").slice(0, 3) ?? [];
  const years = useMemo(() => {
    const current = Number(initialYear) || Number(date.year) || 1405;
    return Array.from({ length: 12 }, (_, index) => String(current + 1 - index));
  }, [date.year, initialYear]);
  const months = (gregorian ? GREGORIAN_MONTHS : JALALI_MONTHS).map((name, index) => ({ value: String(index + 1), label: name }));

  const advancedHref = useMemo(() => {
    const params = new URLSearchParams({ source: "transactions" });
    const r = request?.range;
    if (r) {
      params.set("preset", r.preset);
      if (r.from) params.set("from", r.from);
      if (r.to) params.set("to", r.to);
    }
    if (category) params.set("category", category);
    if (useFilters && dashboardFilters?.type) params.set("type", dashboardFilters.type);
    if (useFilters && dashboardFilters?.q) params.set("q", dashboardFilters.q);
    return `${PATHS.EXPORTS}?${params.toString()}`;
  }, [category, dashboardFilters, request?.range, useFilters]);

  const periods: Array<{ id: Period; label: string }> = [
    { id: "daily", label: t("dashboard.durationDaily") },
    { id: "monthly", label: t("dashboard.durationMonthly") },
    { id: "yearly", label: t("dashboard.durationYearly") },
    { id: "custom", label: t("exports.quick.custom") },
    { id: "all", label: t("dashboard.durationAll") },
  ];
  const formats: Array<{ id: ExportFormat; label: string; hint: string; icon: typeof TableDocument }> = [
    { id: "xlsx", label: t("exports.format.xlsx"), hint: t("exports.quick.xlsxHint"), icon: TableDocument },
    { id: "csv", label: t("exports.format.csv"), hint: t("exports.quick.csvHint"), icon: DocumentText },
    { id: "html", label: t("exports.format.html"), hint: t("exports.quick.htmlHint"), icon: Printer },
  ];

  return (
    <AppModal open={open} onOpenChange={onOpenChange} size="md">
      <AppModalDialog>
        <AppModalHeader>
          <div className="flex items-center gap-2">
            <Export size={22} className="text-accent" />
            <Modal.Heading>{t("exports.quick.title")}</Modal.Heading>
          </div>
        </AppModalHeader>
        <Modal.Body className="space-y-5">
          {!quickAllowed ? (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-sm leading-7">
              <Lock1 size={20} variant="Bold" className="mt-1 shrink-0 text-warning-foreground" />
              <span>
                خروجی گرفتن در اشتراک فعلی شما فعال نیست.{" "}
                <Link href={PATHS.PLANS} className="font-semibold text-accent hover:underline" onClick={() => onOpenChange(false)}>
                  مشاهدهٔ اشتراک‌ها
                </Link>
              </span>
            </div>
          ) : null}
          <div className="space-y-2">
            <p id="quick-export-period" className="text-sm font-medium">
              {t("dashboard.timeRange")}
            </p>
            <div className="grid grid-cols-5 gap-1 rounded-xl bg-surface-secondary p-1" role="radiogroup" aria-labelledby="quick-export-period">
              {periods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={period === item.id}
                  onClick={() => setPeriod(item.id)}
                  className={`min-h-9 rounded-lg px-1 text-xs font-semibold transition-colors ${
                    period === item.id ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {period === "daily" ? (
              <FormDatePicker
                label={t("exports.quick.day")}
                year={date.year}
                month={date.month}
                day={date.day}
                inModal
                calendarType={calendar}
                onChange={setDate}
              />
            ) : null}
            {period === "monthly" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted">{t("exports.quick.month")}</p>
                  <AppSelect ariaLabel={t("exports.quick.month")} value={String(Number(date.month))} options={months} onChange={(month) => setDate({ ...date, month })} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted">{t("exports.quick.year")}</p>
                  <AppSelect
                    ariaLabel={t("exports.quick.year")}
                    value={date.year}
                    options={years.map((year) => ({ value: year, label: toPersianDigits(year) }))}
                    onChange={(year) => setDate({ ...date, year })}
                  />
                </div>
              </div>
            ) : null}
            {period === "yearly" ? (
              <div className="space-y-1.5">
                <p className="text-xs text-muted">{t("exports.quick.year")}</p>
                <AppSelect
                  ariaLabel={t("exports.quick.year")}
                  value={date.year}
                  options={years.map((year) => ({ value: year, label: toPersianDigits(year) }))}
                  onChange={(year) => setDate({ ...date, year })}
                />
              </div>
            ) : null}
            {period === "custom" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <FormDatePicker
                  label={t("exports.range.from")}
                  {...splitRange(range.from)}
                  inModal
                  calendarType={calendar}
                  onChange={(parts) => setRange({ ...range, from: joinRange(parts) })}
                />
                <FormDatePicker
                  label={t("exports.range.to")}
                  {...splitRange(range.to)}
                  inModal
                  calendarType={calendar}
                  onChange={(parts) => setRange({ ...range, to: joinRange(parts) })}
                />
              </div>
            ) : null}
          </div>

          <FormCategoryComboBox
            label={t("dashboard.filterByCategory")}
            placeholder={t("dashboard.allCategories")}
            selectedKey={category || "all"}
            onSelectionChange={(key) => setCategory(key === "all" ? "" : key)}
            allowCreate={false}
            options={[{ id: "all", label: t("dashboard.allCategories") }, ...categoryOptions]}
            emptyMessage={t("dashboard.noCategoryCreatedYet")}
          />

          {extraFilters.length ? (
            <SwitchRow
              label={t("exports.quick.useFilters")}
              description={extraFilters.join("، ")}
              selected={useFilters}
              onChange={setUseFilters}
            />
          ) : null}

          <div className="space-y-2">
            <p id="quick-export-format" className="text-sm font-medium">
              {t("dashboard.exportFormat")}
            </p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="quick-export-format">
              {formats.map((item) => {
                const Icon = item.icon;
                const active = format === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setFormat(item.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors sm:flex-row sm:items-start sm:gap-2.5 sm:p-3 sm:text-start ${
                      active ? "border-accent bg-accent/10" : "border-border bg-surface-secondary hover:border-accent/40"
                    }`}
                  >
                    <Icon size={20} className={active ? "text-accent" : "text-muted"} variant={active ? "Bold" : "Linear"} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">{item.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-secondary/60 p-3 text-sm" aria-live="polite">
            {!quickAllowed ? (
              <p className="text-muted">برای دیدن تعداد ردیف‌ها، اشتراکی با امکان خروجی لازم است.</p>
            ) : !request ? (
              <p className="text-muted">{t("exports.quick.pickPeriod")}</p>
            ) : previewState === "error" ? (
              <p className="text-danger">{t("exports.quick.countError")}</p>
            ) : !sheet ? (
              <p className="flex items-center gap-2 text-muted">
                <Spinner size="sm" /> {t("exports.quick.counting")}
              </p>
            ) : (
              <div className={`space-y-1.5 ${previewState === "loading" ? "opacity-60" : ""}`}>
                <p className="font-semibold">
                  {t("exports.quick.included", { count: sheet.matched.toLocaleString("en-US"), range: preview.rangeLabel })}
                </p>
                {kpis.length ? (
                  <p className="text-xs leading-6 text-muted">{kpis.map((kpi) => `${kpi.label}: ${kpi.text}`).join(" · ")}</p>
                ) : null}
                <p className="text-xs leading-6 text-muted">
                  {format === "csv" ? t("exports.quick.includesCsv") : t("exports.quick.includes")}
                </p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="flex-wrap items-center gap-2">
          <Link
            href={advancedHref}
            className="inline-flex w-full items-center justify-center gap-1 rounded-lg px-1 py-2 text-sm font-semibold text-accent hover:underline sm:me-auto sm:w-auto sm:justify-start"
            onClick={() => onOpenChange(false)}
          >
            {advancedAllowed ? null : <Crown size={15} variant="Bold" className="text-warning" aria-label="نیازمند ارتقای اشتراک" />}
            {t("exports.quick.advanced")}
            <ArrowLeft size={16} />
          </Link>
          <Button type="button" variant="secondary" className="flex-1 sm:flex-none" isPending={busy === "open"} isDisabled={!request || !quickAllowed || busy !== null} onPress={() => void run("open")}>
            <Printer size={17} />
            {t("exports.download.print")}
          </Button>
          <Button type="button" className="flex-1 sm:flex-none" isPending={busy === "download"} isDisabled={!request || !quickAllowed || busy !== null} onPress={() => void run("download")}>
            <DocumentDownload size={17} />
            {t("dashboard.downloadExport")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}

function splitRange(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return { year, month, day };
}

function joinRange(parts: { year: string; month: string; day: string }) {
  return parts.year && parts.month ? `${parts.year}-${parts.month}-${parts.day || "1"}` : "";
}
