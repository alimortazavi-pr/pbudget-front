"use client";

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
import { JALALI_MONTHS } from "@/common/utils/jalali-date";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormCategoryComboBox } from "@/components/common/form/FormFields";
import { AppModal, AppModalHeader } from "@/components/common/ui/AppModal";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";

const DURATION_OPTIONS: Array<{ id: BudgetDuration; label: string; hint: string }> = [
  { id: "daily", label: "روزانه", hint: "تراکنش‌های یک روز مشخص" },
  { id: "monthly", label: "ماهانه", hint: "کل ماه انتخاب‌شده" },
  { id: "yearly", label: "سالانه", hint: "تمام ماه‌های یک سال" },
  { id: "all", label: "همه", hint: "تمام تراکنش‌های ثبت‌شده" },
];

const EXPORT_OPTIONS: Array<{
  id: BudgetExportType;
  label: string;
  hint: string;
  icon: typeof DocumentDownload;
}> = [
  {
    id: "excel",
    label: "Excel",
    hint: "۳ شیت: خلاصه گزارش، تراکنش‌ها (با توضیحات)، تفکیک دسته",
    icon: DocumentDownload,
  },
  {
    id: "html",
    label: "گزارش وب",
    hint: "صفحه زیبا با کاور، آمار، جدول توضیحات و دکمه چاپ/PDF",
    icon: DocumentText,
  },
];

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

  const periodPreview = useMemo(() => {
    const monthName = JALALI_MONTHS[Number(date.month) - 1] ?? date.month;
    if (duration === "all") return "تمام تراکنش‌ها";
    if (duration === "yearly") return `سال ${date.year}`;
    if (duration === "monthly") return `${monthName} ${date.year}`;
    return `${date.day} ${monthName} ${date.year}`;
  }, [duration, date]);

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
      showToast("سال را انتخاب کنید");
      return false;
    }
    if ((duration === "monthly" || duration === "daily") && !date.month) {
      showToast("ماه را انتخاب کنید");
      return false;
    }
    if (duration === "daily" && !date.day) {
      showToast("روز را انتخاب کنید");
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
        showToast("گزارش در تب جدید باز شد", "success");
      } else {
        downloadExportFile(blob, exportType, duration, date);
        showToast("فایل خروجی دانلود شد", "success");
        onOpenChange(false);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در دریافت خروجی");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog className="overflow-visible">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-2">
            <Export size={22} className="text-accent" />
            <Modal.Heading>خروجی گزارش مالی</Modal.Heading>
          </div>
        </AppModalHeader>
        <Modal.Body className="space-y-5 overflow-visible">
          <div className="rounded-2xl border border-border/60 bg-surface-secondary/70 px-4 py-3 text-sm leading-7 text-muted">
            گزارش شامل <strong className="text-foreground">خلاصه آماری</strong>،{" "}
            <strong className="text-foreground">تفکیک دسته‌بندی</strong>،{" "}
            <strong className="text-foreground">توضیحات هر تراکنش</strong> و اطلاعات
            کاربر است. بازه انتخابی: <strong className="text-foreground">{periodPreview}</strong>
          </div>

          <FormCategoryComboBox
            label="دسته‌بندی"
            placeholder="همه دسته‌بندی‌ها"
            selectedKey={category || "all"}
            onSelectionChange={(key) => setCategory(key === "all" ? "" : key)}
            options={[
              { id: "all", label: "همه دسته‌بندی‌ها" },
              ...categoryOptions,
            ]}
            emptyMessage="دسته‌ای ثبت نشده"
          />

          {duration !== "all" ? (
            <FilterDatePicker
              year={date.year}
              month={date.month}
              day={date.day}
              inModal
              onChange={setDate}
            />
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">بازه زمانی</p>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {DURATION_OPTIONS.map((option) => (
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
            <p className="text-sm font-medium">فرمت خروجی</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {EXPORT_OPTIONS.map((option) => {
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
            بستن
          </Button>
          {exportType === "html" && (
            <Button
              type="button"
              variant="secondary"
              isPending={exporting}
              onPress={() => void handleExport("preview")}
            >
              مشاهده در مرورگر
            </Button>
          )}
          <Button
            type="button"
            isPending={exporting}
            onPress={() => void handleExport("download")}
          >
            دانلود خروجی
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </AppModal>
  );
}
