"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IDebt } from "@/common/interfaces/debt.interface";
import { formatJalaliDate, formatPrice, toEnglishDigits, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FormPriceInput } from "@/components/common/form/FormFields";
import { DebtType } from "@/types/enums";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { currencyLabel } from "@/common/constants/user-preferences";

type DebtSettleModalProps = {
  debt: IDebt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettled: () => void;
};

export function DebtSettleModal({
  debt,
  open,
  onOpenChange,
  onSettled,
}: DebtSettleModalProps) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const [candidates, setCandidates] = useState<IBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open || !debt) return;

    setSelectedIds(new Set());
    setAmount(String(debt.remainingAmount));
    setLoading(true);

    debtsApi
      .fetchSettlementCandidates(debt._id)
      .then((res) => setCandidates(res.budgets))
      .catch((err) =>
        showToast(err instanceof Error ? err.message : "خطا در بارگذاری تراکنش‌ها"),
      )
      .finally(() => setLoading(false));
  }, [open, debt]);

  function toggleSelection(budgetId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(budgetId)) next.delete(budgetId);
      else next.add(budgetId);
      return next;
    });
  }

  async function handleSubmit() {
    if (!debt || selectedIds.size === 0) {
      showToast(t("حداقل یک تراکنش برای تسویه انتخاب کنید"));
      return;
    }

    setSubmitting(true);
    try {
      if (selectedIds.size === 1) {
        const budgetId = Array.from(selectedIds)[0];
        await debtsApi.settleDebt(debt._id, {
          budgetId,
          amount: toEnglishDigits(amount) || undefined,
        });
      } else {
        await debtsApi.settleDebtBulk(
          debt._id,
          Array.from(selectedIds).map((budgetId) => ({ budgetId })),
        );
      }
      showToast(t("تسویه ثبت شد"), "success");
      onSettled();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در تسویه");
    } finally {
      setSubmitting(false);
    }
  }

  if (!debt) return null;

  const hint =
    debt.type === DebtType.RECEIVABLE
      ? "تراکنش‌های دریافتی (واریز) که واقعاً پول را گرفته‌اید انتخاب کنید."
      : "تراکنش‌های پرداختی (برداشت) که واقعاً بدهی را پرداخت کرده‌اید انتخاب کنید.";

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>تسویه {debt.person}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          <p className="text-sm text-muted">{hint}</p>
          <p className="text-sm">
            مانده: <strong>{formatPrice(debt.remainingAmount)}</strong>
          </p>

          {selectedIds.size <= 1 ? (
            <FormPriceInput
              label={`مبلغ تسویه (${currencyLabel(preferredCurrency)})`}
              value={amount}
              onChange={setAmount}
            />
          ) : (
            <p className="rounded-xl bg-surface-secondary px-3 py-2 text-xs text-muted">
              برای تسویه چندتایی، از کل مبلغ هر تراکنش تا سقف مانده استفاده می‌شود.
            </p>
          )}

          {loading ? (
            <p className="text-sm text-muted">{t("در حال بارگذاری تراکنش‌ها…")}</p>
          ) : candidates.length === 0 ? (
            <p className="rounded-xl bg-surface-secondary p-3 text-sm text-muted">
              تراکنش مناسبی پیدا نشد. ابتدا تراکنش{" "}
              {debt.type === DebtType.RECEIVABLE ? "دریافتی (واریز)" : "پرداختی (برداشت)"}{" "}
              ثبت کنید.
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {candidates.map((budget) => {
                const isSelected = selectedIds.has(budget._id);
                return (
                  <button
                    key={budget._id}
                    type="button"
                    onClick={() => toggleSelection(budget._id)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-right text-sm transition ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-surface-secondary"
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                          isSelected
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-surface"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </span>
                      <span className="truncate font-medium">{budget.category?.title}</span>
                    </span>
                    <span className="shrink-0 text-muted">
                      {formatJalaliDate(budget.year, budget.month, budget.day)} ·{" "}
                      {formatPrice(budget.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            variant="primary"
            onPress={() => void handleSubmit()}
            isDisabled={submitting || selectedIds.size === 0}
          >
            {submitting
              ? "در حال ثبت…"
              : selectedIds.size > 1
                ? `ثبت ${toPersianDigits(selectedIds.size)} تسویه`
                : "ثبت تسویه"}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
