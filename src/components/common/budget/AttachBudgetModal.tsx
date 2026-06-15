"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Modal } from "@heroui/react";
import { Add, ArrowLeft2, ArrowRight2, SearchNormal1 } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import type { IBudget } from "@/common/interfaces/budget.interface";
import {
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliYear,
  formatPrice,
  getJalaliNow,
  toPersianDigits,
} from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormCategoryComboBox } from "@/components/common/form/FormFields";
import { AppModal, AppModalHeader, modalSheetBodyClass } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { BudgetType } from "@/types/enums";

export type AttachBudgetContext =
  | { type: "project"; contextId: string }
  | { type: "debt-source"; contextId: string }
  | { type: "occurrence"; contextId: string };

type AttachBudgetModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  context: AttachBudgetContext;
  onAttach: (budgetId: string) => Promise<void>;
  attachLabel?: string;
};

type DurationFilter = "monthly" | "yearly" | "all";

export function AttachBudgetModal({
  open,
  onOpenChange,
  title,
  description,
  context,
  onAttach,
  attachLabel = "انتخاب",
}: AttachBudgetModalProps) {
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const now = getJalaliNow();

  const [duration, setDuration] = useState<DurationFilter>("monthly");
  const [year, setYear] = useState(String(now.jYear()));
  const [month, setMonth] = useState(String(now.jMonth() + 1));
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<IBudget[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const periodLabel = useMemo(() => {
    if (duration === "all") return "همه تراکنش‌ها";
    if (duration === "yearly") return formatJalaliYear(year);
    return formatJalaliMonthYear(year, month);
  }, [duration, year, month]);

  const load = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const list = await budgetsApi.fetchBudgetsForAttach({
        context: context.type,
        contextId: context.contextId,
        duration,
        year: duration === "all" ? undefined : year,
        month: duration === "monthly" ? month : undefined,
        category: category || undefined,
        q: debouncedSearch || undefined,
      });
      setBudgets(list);
    } catch (err) {
      showErrorToast(err, "خطا در بارگذاری تراکنش‌ها");
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [open, context, duration, year, month, category, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  function shiftMonth(delta: number) {
    const next = getJalaliNow()
      .jYear(parseInt(year, 10))
      .jMonth(parseInt(month, 10) - 1)
      .add(delta, "month");
    setYear(String(next.jYear()));
    setMonth(String(next.jMonth() + 1));
  }

  function shiftYear(delta: number) {
    setYear(String(parseInt(year, 10) + delta));
  }

  async function handleAttach(budgetId: string) {
    setAttachingId(budgetId);
    try {
      await onAttach(budgetId);
      showToast("تراکنش وصل شد", "success");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "خطا در وصل کردن تراکنش");
    } finally {
      setAttachingId(null);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} size="lg" mobileFull>
      <Modal.Dialog className="flex max-h-[min(92dvh,760px)] w-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface sm:max-w-2xl">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{title}</Modal.Heading>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </AppModalHeader>

        <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "monthly" as const, label: "ماهانه" },
                { id: "yearly" as const, label: "سالانه" },
                { id: "all" as const, label: "همه" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDuration(item.id)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  duration === item.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-secondary text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {duration !== "all" && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-secondary px-2 py-1">
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => (duration === "yearly" ? shiftYear(-1) : shiftMonth(-1))}
              >
                <ArrowRight2 size={18} />
              </Button>
              <p className="text-sm font-medium">{periodLabel}</p>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => (duration === "yearly" ? shiftYear(1) : shiftMonth(1))}
              >
                <ArrowLeft2 size={18} />
              </Button>
            </div>
          )}

          <FormCategoryComboBox
            label="دسته‌بندی"
            placeholder="همه دسته‌ها"
            selectedKey={category || "all"}
            onSelectionChange={(key) => setCategory(key === "all" ? "" : key)}
            options={[{ id: "all", label: "همه دسته‌ها" }, ...categoryOptions]}
          />

          <div className="relative">
            <SearchNormal1
              size={18}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <Input
              className="pr-10"
              placeholder="جستجو در توضیحات یا دسته…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-muted">در حال بارگذاری…</p>
          ) : budgets.length === 0 ? (
            <p className="rounded-xl bg-surface-secondary p-6 text-center text-sm text-muted">
              تراکنشی برای این بازه پیدا نشد
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted">{toPersianDigits(budgets.length)} تراکنش</p>
              {budgets.map((budget) => {
                const isIncome = budget.type === BudgetType.INCOME;
                const categoryTitle =
                  typeof budget.category === "object" && budget.category
                    ? budget.category.title
                    : "بدون دسته";

                return (
                  <div
                    key={budget._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{categoryTitle}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatJalaliDate(
                          String(budget.year),
                          String(budget.month),
                          String(budget.day),
                        )}
                        {budget.description ? ` · ${budget.description}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <p
                        className={`text-sm font-bold ${isIncome ? "text-income" : "text-expense"}`}
                      >
                        {formatPrice(budget.price)}
                      </p>
                      <Button
                        size="sm"
                        onPress={() => void handleAttach(budget._id)}
                        isPending={attachingId === budget._id}
                      >
                        {attachLabel}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal.Body>
      </Modal.Dialog>
    </AppModal>
  );
}

type AttachBudgetButtonProps = {
  title: string;
  description: string;
  emptyMessage?: string;
  context: AttachBudgetContext;
  onAttach: (budgetId: string) => Promise<void>;
  attachLabel?: string;
};

export function AttachBudgetButton({
  title,
  description,
  context,
  onAttach,
  attachLabel,
}: AttachBudgetButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="secondary" onPress={() => setOpen(true)}>
        <Add size={16} />
        {title}
      </Button>
      <AttachBudgetModal
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        context={context}
        onAttach={onAttach}
        attachLabel={attachLabel}
      />
    </>
  );
}
