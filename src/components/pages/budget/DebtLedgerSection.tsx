"use client";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import { useMergedPersons } from "@/common/hooks/useMergedPersons";
import type { IDebt } from "@/common/interfaces/debt.interface";
import { formatPrice } from "@/common/utils";
import { FormPersonComboBox, FormSelect } from "@/components/common/form/FormFields";
import { DebtType } from "@/types/enums";

export type DebtLedgerMode = "create" | "settle-receivable" | "settle-payable";

export type DebtLedgerValue = {
  enabled: boolean;
  mode: DebtLedgerMode;
  debtType: string;
  person: string;
  settleDebtId: string;
};

type DebtLedgerSectionProps = {
  amount: string;
  value: DebtLedgerValue;
  onChange: (patch: Partial<DebtLedgerValue>) => void;
};

function debtTypeLabel(type: number) {
  return type === DebtType.RECEIVABLE ? "طلب" : "بدهی";
}

function isSettleMode(mode: DebtLedgerMode) {
  return mode === "settle-receivable" || mode === "settle-payable";
}

type LinkedDebtSummaryProps = {
  debt: IDebt;
};

export function LinkedDebtSummary({ debt }: LinkedDebtSummaryProps) {
  const isReceivable = debt.type === DebtType.RECEIVABLE;
  const statusLabel =
    debt.status === "settled"
      ? "تسویه‌شده"
      : debt.status === "partial"
        ? "تسویه جزئی"
        : "باز";

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <p className="text-sm font-medium">مرتبط با طلب یا بدهی</p>
      <div
        className={`rounded-xl px-3 py-3 text-sm ${
          isReceivable ? "bg-income-soft/50 text-income" : "bg-expense-soft/50 text-expense"
        }`}
      >
        <p className="font-semibold">
          {isReceivable ? "طلب" : "بدهی"} · {debt.person}
        </p>
        <p className="mt-1 text-xs opacity-90">
          مانده {formatPrice(debt.remainingAmount)} از {formatPrice(debt.totalAmount)} ·{" "}
          {statusLabel}
        </p>
      </div>
      <p className="text-xs leading-6 text-muted">
        این تراکنش منبع ثبت این {isReceivable ? "طلب" : "بدهی"} است. برای تسویه یا ویرایش
        جزئیات به صفحه طلب و بدهی بروید.
      </p>
    </div>
  );
}

export function DebtLedgerSection({
  amount,
  value,
  onChange,
}: DebtLedgerSectionProps) {
  const persons = useMergedPersons(value.enabled);
  const [openDebts, setOpenDebts] = useState<IDebt[]>([]);

  const settleDebtType =
    value.mode === "settle-receivable" ? DebtType.RECEIVABLE : DebtType.PAYABLE;

  useEffect(() => {
    if (!value.enabled || !isSettleMode(value.mode)) return;
    void debtsApi
      .fetchDebts({ status: "open", type: String(settleDebtType) })
      .then((res) => setOpenDebts(res.debts))
      .catch(() => setOpenDebts([]));
  }, [value.enabled, value.mode, settleDebtType]);

  const settleOptions = useMemo(
    () =>
      openDebts.map((debt) => ({
        id: debt._id,
        label: `${debt.person} · ${debtTypeLabel(debt.type)} · مانده ${formatPrice(debt.remainingAmount)}`,
      })),
    [openDebts],
  );

  const selectedSettleDebt = openDebts.find((debt) => debt._id === value.settleDebtId);

  const modeButtons: { id: DebtLedgerMode; label: string }[] = [
    { id: "create", label: "ثبت طلب/بدهی جدید" },
    { id: "settle-receivable", label: "دریافت طلب" },
    { id: "settle-payable", label: "پرداخت بدهی" },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">مرتبط با طلب یا بدهی</p>
          <p className="mt-1 text-xs text-muted">
            ثبت تعهد جدید یا تسویه موردی که قبلاً ثبت شده
          </p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(selected) => onChange({ enabled: selected })}
          size="sm"
          aria-label="مرتبط با طلب یا بدهی"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {value.enabled && (
        <div className="space-y-3 border-t border-border/40 pt-3">
          <div className="grid grid-cols-2 gap-2">
            {modeButtons.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({ mode: item.id })}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  item.id === "create" ? "col-span-2" : ""
                } ${
                  value.mode === item.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {value.mode === "create" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[
                  { id: String(DebtType.RECEIVABLE), label: "طلب" },
                  { id: String(DebtType.PAYABLE), label: "بدهی" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange({ debtType: item.id })}
                    className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium ${
                      value.debtType === item.id
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <FormPersonComboBox
                label="نام طرف حساب"
                value={value.person}
                onChange={(person) => onChange({ person })}
                options={persons}
                placeholder="مثلاً علی، فروشگاه X"
              />

              <p className="text-xs leading-6 text-muted">
                {value.debtType === String(DebtType.RECEIVABLE)
                  ? "طلب: تراکنش باید پرداختی (برداشت از حساب شما) باشد — وقتی به کسی وام داده‌اید."
                  : "بدهی: تراکنش باید دریافتی (واریز به حساب شما) باشد — وقتی قرض گرفته‌اید یا نسیه خریده‌اید."}
              </p>
            </div>
          )}

          {isSettleMode(value.mode) && (
            <div className="space-y-3">
              <FormSelect
                label={
                  value.mode === "settle-receivable"
                    ? "کدام طلب تسویه می‌شود؟"
                    : "کدام بدهی پرداخت می‌شود؟"
                }
                placeholder="یک مورد انتخاب کنید"
                selectedKey={value.settleDebtId || undefined}
                onSelectionChange={(key) => onChange({ settleDebtId: key })}
                options={settleOptions}
                emptyMessage={
                  value.mode === "settle-receivable"
                    ? "طلب بازی برای دریافت نیست"
                    : "بدهی بازی برای پرداخت نیست"
                }
              />

              {selectedSettleDebt && amount && (
                <p className="rounded-xl bg-surface px-3 py-2 text-xs text-muted">
                  با ثبت این تراکنش، حداکثر{" "}
                  <strong className="text-foreground">
                    {formatPrice(
                      Math.min(
                        selectedSettleDebt.remainingAmount,
                        Number(amount.replace(/,/g, "")) || 0,
                      ),
                    )}
                  </strong>{" "}
                  از مانده {formatPrice(selectedSettleDebt.remainingAmount)} تسویه
                  می‌شود.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
