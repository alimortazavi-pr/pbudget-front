"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Add } from "iconsax-reactjs";

import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatJalaliDate, formatPrice } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { BudgetType } from "@/types/enums";

type AttachBudgetPanelProps = {
  title: string;
  description: string;
  emptyMessage: string;
  loadCandidates: () => Promise<IBudget[]>;
  onAttach: (budgetId: string) => Promise<void>;
  attachLabel?: string;
};

export function AttachBudgetPanel({
  title,
  description,
  emptyMessage,
  loadCandidates,
  onAttach,
  attachLabel = "افزودن",
}: AttachBudgetPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<IBudget[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadCandidates();
      setCandidates(list);
    } catch (err) {
      showErrorToast(err, "خطا در بارگذاری تراکنش‌ها");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [loadCandidates]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  async function handleAttach(budgetId: string) {
    setAttachingId(budgetId);
    try {
      await onAttach(budgetId);
      showToast("تراکنش وصل شد", "success");
      setOpen(false);
    } catch (err) {
      showErrorToast(err, "خطا در وصل کردن تراکنش");
    } finally {
      setAttachingId(null);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="secondary" onPress={() => setOpen(true)}>
        <Add size={16} />
        {title}
      </Button>
    );
  }

  return (
    <section className="glass space-y-3 rounded-2xl border border-dashed border-accent/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs leading-6 text-muted">{description}</p>
        </div>
        <Button size="sm" variant="ghost" onPress={() => setOpen(false)}>
          بستن
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">در حال بارگذاری تراکنش‌ها…</p>
      ) : candidates.length === 0 ? (
        <p className="rounded-xl bg-surface-secondary p-3 text-sm text-muted">{emptyMessage}</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {candidates.map((budget) => {
            const isIncome = budget.type === BudgetType.INCOME;
            const categoryTitle =
              typeof budget.category === "object" && budget.category
                ? budget.category.title
                : "بدون دسته";

            return (
              <div
                key={budget._id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{categoryTitle}</p>
                  <p className="text-xs text-muted">
                    {formatJalaliDate(String(budget.year), String(budget.month), String(budget.day))}
                    {budget.description ? ` · ${budget.description}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <p className={`text-sm font-bold ${isIncome ? "text-income" : "text-expense"}`}>
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
    </section>
  );
}
