"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Input, Modal } from "@heroui/react";
import { Add, ArrowLeft2, ArrowRight2, SearchNormal1 } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import type { IBudget } from "@/common/interfaces/budget.interface";
import {
  formatBudgetDate,
  formatJalaliMonthYear,
  formatJalaliYear,
  formatPriceWithCurrency,
  getNowDateParts,
  toPersianDigits,
} from "@/common/utils";
import { resolveBudgetCurrency } from "@/common/constants/user-preferences";
import moment from "moment-jalali";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormCategoryComboBox } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
} from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";
import { BudgetType } from "@/types/enums";

export type AttachBudgetContext =
  | { type: "project"; contextId: string }
  | { type: "debt-source"; contextId: string }
  | { type: "debt-settlement"; contextId: string }
  | { type: "occurrence"; contextId: string };

type AttachBudgetModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  context: AttachBudgetContext;
  onAttach: (budgetId: string) => Promise<void>;
  onAttachMultiple?: (budgetIds: string[]) => Promise<void>;
  /** Multi = checkbox; single = one transaction only */
  selectionMode?: "single" | "multiple";
  attachLabel?: string;
};

type DurationFilter = "monthly" | "yearly" | "all";

const PAGE_SIZE = 40;

export function AttachBudgetModal({
  open,
  onOpenChange,
  title,
  description,
  context,
  onAttach,
  onAttachMultiple,
  selectionMode = "multiple",
  attachLabel = "",
}: AttachBudgetModalProps) {
  const { t } = useTranslation();
  const resolvedAttachLabel = attachLabel || t("common.attachSelect");
  const multiSelect = selectionMode === "multiple";
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);
  const calendarType = user?.preferences?.dateCalendar ?? "jalali";
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const nowParts = getNowDateParts(calendarType);

  const [duration, setDuration] = useState<DurationFilter>("monthly");
  const [year, setYear] = useState(nowParts.year);
  const [month, setMonth] = useState(nowParts.month);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [attachingMultiple, setAttachingMultiple] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        context,
        duration,
        year,
        month,
        category,
        debouncedSearch,
      }),
    [context, duration, year, month, category, debouncedSearch],
  );

  const periodLabel = useMemo(() => {
    if (duration === "all") return t("common.allTransactions");
    if (duration === "yearly") return formatJalaliYear(year);
    return formatJalaliMonthYear(year, month);
  }, [duration, year, month]);

  const fetchPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (!open) return;

      if (append) {
        if (loadingMoreRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await budgetsApi.fetchBudgetsForAttach({
          context: context.type,
          contextId: context.contextId,
          duration,
          year: duration === "all" ? undefined : year,
          month: duration === "monthly" ? month : undefined,
          category: category || undefined,
          q: debouncedSearch || undefined,
          page: String(pageToLoad),
          limit: String(PAGE_SIZE),
        });

        setBudgets((prev) =>
          append ? [...prev, ...result.budgets] : result.budgets,
        );
        setPage(result.page);
        setHasMore(result.hasMore);
        setTotal(result.total);
      } catch (err) {
        showErrorToast(err, t("auto.k0b952d2d1b"));
        if (!append) {
          setBudgets([]);
          setHasMore(false);
          setTotal(0);
        }
      } finally {
        if (append) {
          loadingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [open, context, duration, year, month, category, debouncedSearch],
  );

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      return;
    }
    setPage(1);
    void fetchPage(1, false);
  }, [open, filterKey, fetchPage]);

  useEffect(() => {
    if (!open) return;

    const root = listRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && !loadingMoreRef.current) {
          void fetchPage(page + 1, true);
        }
      },
      { root, rootMargin: "120px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, hasMore, loading, page, fetchPage]);

  function shiftMonth(delta: number) {
    if (calendarType === "gregorian") {
      const next = moment()
        .year(parseInt(year, 10))
        .month(parseInt(month, 10) - 1)
        .date(1)
        .add(delta, "month");
      setYear(String(next.year()));
      setMonth(String(next.month() + 1));
      return;
    }
    const next = moment(`${year}/${month}/1`, "jYYYY/jM/jD").add(delta, "jMonth");
    setYear(String(next.jYear()));
    setMonth(String(next.jMonth() + 1));
  }

  function shiftYear(delta: number) {
    setYear(String(parseInt(year, 10) + delta));
  }

  function toggleSelection(budgetId: string) {
    setSelectedIds((prev) => {
      if (!multiSelect) {
        return prev.has(budgetId) ? new Set() : new Set([budgetId]);
      }
      const next = new Set(prev);
      if (next.has(budgetId)) next.delete(budgetId);
      else next.add(budgetId);
      return next;
    });
  }

  async function handleConfirmSelection() {
    const budgetIds = Array.from(selectedIds);
    if (!budgetIds.length) return;

    setAttachingMultiple(true);
    try {
      if (budgetIds.length > 1 && onAttachMultiple) {
        await onAttachMultiple(budgetIds);
      } else if (budgetIds.length > 1) {
        for (const budgetId of budgetIds) {
          await onAttach(budgetId);
        }
      } else {
        await onAttach(budgetIds[0]);
      }
      showToast(
        budgetIds.length === 1
          ? t("auto.k8d4d55dab7")
          : `${toPersianDigits(budgetIds.length)} ${t("auto.keb7bb3e55b")} ${t("auto.k0c2b72681b")}`,
        "success",
      );
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, t("auto.keff3fe1941"));
    } finally {
      setAttachingMultiple(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} size="lg" mobileFull>
      <AppModalDialog className="flex max-h-[min(92dvh,760px)] w-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface sm:max-w-2xl">
        <AppModalHeader>
          <Modal.Heading>{title}</Modal.Heading>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </AppModalHeader>

        <Modal.Body className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          <div className="shrink-0 space-y-4 border-b border-border/40 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "monthly" as const, label: t("common.monthly") },
                  { id: "yearly" as const, label: t("common.yearly") },
                  { id: "all" as const, label: t("common.all") },
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
              label={t("common.category")}
              placeholder={t("common.allCategories")}
              selectedKey={category || "all"}
              onSelectionChange={(key) => setCategory(key === "all" ? "" : key)}
              allowCreate={false}
              options={[{ id: "all", label: t("common.allCategories") }, ...categoryOptions]}
            />

            <div className="relative">
              <SearchNormal1
                size={18}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                className="pr-10"
                placeholder={t("common.searchEllipsis")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div ref={listRef} className={`${modalSheetBodyClass} min-h-0 flex-1`}>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted">{t("common.loading")}</p>
            ) : budgets.length === 0 ? (
              <p className="rounded-xl bg-surface-secondary p-6 text-center text-sm text-muted">
                {t("budget.noTransactionsInRange")}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted">
                  {toPersianDigits(budgets.length)}
                  {total > budgets.length ? ` ${t("dashboard.ofDuration")} ${toPersianDigits(total)}` : ""}{" "}
                  {t("nav.createTransaction")}
                </p>
                {budgets.map((budget) => {
                  const isIncome = budget.type === BudgetType.INCOME;
                  const categoryTitle =
                    typeof budget.category === "object" && budget.category
                      ? budget.category.title
                      : t("common.noCategory");
                  const isSelected = selectedIds.has(budget._id);

                  return (
                    <button
                      key={budget._id}
                      type="button"
                      onClick={() => toggleSelection(budget._id)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 text-right transition ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border bg-surface-secondary"
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center ${
                            multiSelect ? "rounded-md" : "rounded-full"
                          } border ${
                            isSelected
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-surface"
                          }`}
                          aria-hidden
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{categoryTitle}</p>
                          <p className="mt-1 text-xs text-muted">
                            {formatBudgetDate(
                              String(budget.year),
                              String(budget.month),
                              String(budget.day),
                              budget.dateCalendar,
                            )}
                            {budget.description ? ` · ${budget.description}` : ""}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-bold ${isIncome ? "text-income" : "text-expense"}`}
                      >
                        {formatPriceWithCurrency(
                          budget.price,
                          resolveBudgetCurrency(budget.currency),
                        )}
                      </p>
                    </button>
                  );
                })}

                <div ref={sentinelRef} className="h-1" aria-hidden />

                {loadingMore && (
                  <p className="py-3 text-center text-xs text-muted">{t("auto.k0d33909087")}</p>
                )}

                {!hasMore && budgets.length > 0 && (
                  <p className="py-2 text-center text-xs text-muted">{t("auto.k1d1b0a94cb")}</p>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-border/40">
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onPress={() => void handleConfirmSelection()}
            isDisabled={selectedIds.size === 0}
            isPending={attachingMultiple}
          >
            {selectedIds.size > 0
              ? multiSelect
                ? t("budget.attachTransactions", {
                    count: toPersianDigits(selectedIds.size),
                  })
                : resolvedAttachLabel
              : multiSelect
                ? t("budget.selectTransaction")
                : t("budget.selectOneTransaction")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}

type AttachBudgetButtonProps = {
  title: string;
  description: string;
  emptyMessage?: string;
  context: AttachBudgetContext;
  onAttach: (budgetId: string) => Promise<void>;
  onAttachMultiple?: (budgetIds: string[]) => Promise<void>;
  selectionMode?: "single" | "multiple";
  attachLabel?: string;
};

export function AttachBudgetButton({
  title,
  description,
  context,
  onAttach,
  onAttachMultiple,
  selectionMode,
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
        onAttachMultiple={onAttachMultiple}
        selectionMode={selectionMode}
        attachLabel={attachLabel}
      />
    </>
  );
}
