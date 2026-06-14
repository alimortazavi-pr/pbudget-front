"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IDebt } from "@/common/interfaces/debt.interface";
import { formatJalaliDate, formatPrice, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { DebtType } from "@/types/enums";

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
  const [candidates, setCandidates] = useState<IBudget[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open || !debt) return;

    setSelectedBudgetId("");
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

  async function handleSubmit() {
    if (!debt || !selectedBudgetId) {
      showToast("یک تراکنش برای تسویه انتخاب کنید");
      return;
    }

    setSubmitting(true);
    try {
      await debtsApi.settleDebt(debt._id, {
        budgetId: selectedBudgetId,
        amount: toEnglishDigits(amount),
      });
      showToast("تسویه ثبت شد", "success");
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
      ? "تراکنش دریافتی (واریز) را که واقعاً پول را گرفته‌اید انتخاب کنید."
      : "تراکنش پرداختی که واقعاً بدهی را پرداخت کرده‌اید انتخاب کنید.";

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog className="max-w-lg">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading>تسویه {debt.person}</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="space-y-4">
          <p className="text-sm text-muted">{hint}</p>
          <p className="text-sm">
            مانده: <strong>{formatPrice(debt.remainingAmount)}</strong>
          </p>

          <FormInput
            label="مبلغ تسویه (تومان)"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {loading ? (
            <p className="text-sm text-muted">در حال بارگذاری تراکنش‌ها…</p>
          ) : candidates.length === 0 ? (
            <p className="rounded-xl bg-surface-secondary p-3 text-sm text-muted">
              تراکنش مناسبی پیدا نشد. ابتدا تراکنش{" "}
              {debt.type === DebtType.RECEIVABLE ? "دریافتی" : "پرداختی"} ثبت کنید.
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto">
              {candidates.map((budget) => (
                <button
                  key={budget._id}
                  type="button"
                  onClick={() => {
                    setSelectedBudgetId(budget._id);
                    if (!amount) setAmount(String(debt.remainingAmount));
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-right text-sm transition ${
                    selectedBudgetId === budget._id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface-secondary"
                  }`}
                >
                  <span className="font-medium">{budget.category?.title}</span>
                  <span className="text-muted">
                    {formatJalaliDate(budget.year, budget.month, budget.day)} ·{" "}
                    {formatPrice(budget.price)}
                  </span>
                </button>
              ))}
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
            isDisabled={submitting || !selectedBudgetId}
          >
            {submitting ? "در حال ثبت…" : "ثبت تسویه"}
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </AppModal>
  );
}
