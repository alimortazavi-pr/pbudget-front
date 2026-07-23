"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { DocumentDownload, DocumentText, Export } from "iconsax-reactjs";

import {
  downloadExportFile,
  exportBudgets,
  openExportInBrowser,
  type BudgetDuration,
  type BudgetExportType,
} from "@/common/api/budgets";
import type { ICategory } from "@/common/interfaces/category.interface";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormCategoryComboBox } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type BudgetExportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ICategory[];
  initialCategory: string;
  initialYear: string;
  initialMonth: string;
  initialDay: string;
  initialDuration?: BudgetDuration;
};

function durationChipClass(active: boolean) {
  return `cursor-pointer rounded-xl border px-3 py-2.5 text-start text-sm font-medium transition-colors ${
    active
      ? "border-accent bg-accent text-accent-foreground"
      : "border-border bg-surface-secondary text-muted hover:border-accent/40"
  }`;
}

export function BudgetExportModal({
  open,
  onOpenChange,
  categories,
  initialCategory,
  initialYear,
  initialMonth,
  initialDay,
  initialDuration = "monthly",
}: BudgetExportModalProps) {
  const { t } = useTranslation();
  const { formatMonthYear, formatDayMonthYear } = useLocalizedDate();
  const user = useAppSelector(userSelector);
  const calendarType = user?.preferences?.dateCalendar ?? "jalali";
  const [category, setCategory] = useState(initialCategory);
  const [date, setDate] = useState({
    year: initialYear,
    month: initialMonth,
    day: initialDay,
  });
  const [duration, setDuration] = useState<BudgetDuration>(initialDuration);
  const [exportType, setExportType] = useState<BudgetExportType>("excel");
  const [exporting, setExporting] = useState(false);

  const categoryOptions = useMemo(
    () => getCategorySelectOptions(categories),
    [categories],
  );

  const durationOptions = useMemo(
    () =>
      [
        {
          id: "daily" as const,
          label: t("dashboard.durationDaily"),
          hint: t("dashboard.durationDailyHint"),
        },
        {
          id: "monthly" as const,
          label: t("dashboard.durationMonthly"),
          hint: t("dashboard.durationMonthlyHint"),
        },
        {
          id: "yearly" as const,
          label: t("dashboard.durationYearly"),
          hint: t("dashboard.durationYearlyHint"),
        },
        {
          id: "all" as const,
          label: t("dashboard.durationAll"),
          hint: t("dashboard.durationAllHint"),
        },
      ] satisfies Array<{ id: BudgetDuration; label: string; hint: string }>,
    [t],
  );

  const exportOptions = useMemo(
    () =>
      [
        {
          id: "excel" as const,
          label: "Excel",
          hint: t("dashboard.exportExcelHint"),
          icon: DocumentDownload,
        },
        {
          id: "html" as const,
          label: t("dashboard.exportWebReport"),
          hint: t("dashboard.exportWebReportHint"),
          icon: DocumentText,
        },
      ] satisfies Array<{
        id: BudgetExportType;
        label: string;
        hint: string;
        icon: typeof DocumentDownload;
      }>,
    [t],
  );

  const periodPreview = useMemo(() => {
    const monthNum = Number(date.month);
    const dayNum = Number(date.day);
    if (duration === "all") return t("dashboard.allTransactions");
    if (duration === "yearly") {
      return t("dashboard.yearLabel", { year: date.year });
    }
    if (duration === "monthly") {
      return formatMonthYear(monthNum, date.year, calendarType);
    }
    return formatDayMonthYear(dayNum, monthNum, date.year, calendarType);
  }, [calendarType, duration, date, formatDayMonthYear, formatMonthYear, t]);

  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory);
    setDate({
      year: initialYear,
      month: initialMonth,
      day: initialDay,
    });
    setDuration(initialDuration);
    setExportType("excel");
  }, [
    open,
    initialCategory,
    initialYear,
    initialMonth,
    initialDay,
    initialDuration,
  ]);

  function validateFilters() {
    if (duration === "all") return true;
    if (!date.year) {
      showToast(t("dashboard.exportDateRequired"));
      return false;
    }
    if ((duration === "monthly" || duration === "daily") && !date.month) {
      showToast(t("dashboard.exportMonthRequired"));
      return false;
    }
    if (duration === "daily" && !date.day) {
      showToast(t("dashboard.exportDayRequired"));
      return false;
    }
    return true;
  }

  function buildFilters() {
    return {
      duration,
      year: date.year,
      month: date.month,
      day: date.day,
      category: category || undefined,
    };
  }

  async function handleExport(mode: "download" | "preview") {
    if (!validateFilters()) return;

    setExporting(true);
    try {
      const blob = await exportBudgets({
        type: exportType,
        ...buildFilters(),
      });

      if (mode === "preview" && exportType === "html") {
        openExportInBrowser(blob);
        showToast(t("dashboard.exportPreviewSuccess"), "success");
      } else {
        downloadExportFile(blob, exportType, duration, date);
        showToast(t("dashboard.exportDownloadSuccess"), "success");
        onOpenChange(false);
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("dashboard.exportFetchError"),
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="overflow-visible">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Export size={22} className="text-accent" />
            <Modal.Heading>{t("dashboard.exportFinancialReport")}</Modal.Heading>
          </div>
        </AppModalHeader>
        <Modal.Body className="space-y-5 overflow-visible">
          <div className="rounded-2xl border border-border/60 bg-surface-secondary/70 px-4 py-3 text-sm leading-7 text-muted">
            {t("dashboard.exportReportIntro", {
              summary: t("dashboard.statisticalSummary"),
              categories: t("dashboard.categoryBreakdown"),
              descriptions: t("dashboard.transactionDescriptions"),
              range: periodPreview,
            })}
          </div>

          <FormCategoryComboBox
            label={t("dashboard.filterByCategory")}
            placeholder={t("dashboard.allCategories")}
            selectedKey={category || "all"}
            onSelectionChange={(key) => setCategory(key === "all" ? "" : key)}
            allowCreate={false}
            options={[
              { id: "all", label: t("dashboard.allCategories") },
              ...categoryOptions,
            ]}
            emptyMessage={t("dashboard.noCategoryCreatedYet")}
          />

          {duration !== "all" ? (
            <FilterDatePicker
              year={date.year}
              month={date.month}
              day={date.day}
              inModal
              calendarType={calendarType}
              onChange={setDate}
            />
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("dashboard.timeRange")}</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {durationOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={durationChipClass(duration === option.id)}
                  onClick={() => setDuration(option.id)}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-xs opacity-80">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("dashboard.exportFormat")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const active = exportType === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`flex items-start gap-3 rounded-xl border p-3 text-start transition-colors ${
                      active
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface-secondary hover:border-accent/40"
                    }`}
                    onClick={() => setExportType(option.id)}
                  >
                    <Icon
                      size={22}
                      className={active ? "text-accent" : "text-muted"}
                      variant={active ? "Bold" : "Linear"}
                    />
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-xs leading-6 text-muted">
                        {option.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex-wrap gap-2">
          <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
          {exportType === "html" && (
            <Button
              type="button"
              variant="secondary"
              isPending={exporting}
              onPress={() => void handleExport("preview")}
            >
              {t("dashboard.viewInBrowser")}
            </Button>
          )}
          <Button
            type="button"
            isPending={exporting}
            onPress={() => void handleExport("download")}
          >
            {t("dashboard.downloadExport")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
