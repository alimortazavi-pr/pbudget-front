"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

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
  return type === DebtType.RECEIVABLE ? t("auto.kf48e3aa79d") : t("auto.kebf7b80fd6");
}

function isSettleMode(mode: DebtLedgerMode) {
  return mode === "settle-receivable" || mode === "settle-payable";
}

type LinkedDebtSummaryProps = {
  debt: IDebt;
};

export function LinkedDebtSummary({ debt }: LinkedDebtSummaryProps) {
  const { t } = useTranslation();
  const isReceivable = debt.type === DebtType.RECEIVABLE;
  const statusLabel =
    debt.status === "settled"
      ? t("debts.settled")
      : debt.status === "partial"
        ? t("auto.ka9b46e77b6")
        : t("auto.k2e91d38fda");

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <p className="text-sm font-medium">{t("auto.k801512f58a")}</p>
      <div
        className={`rounded-xl px-3 py-3 text-sm ${
          isReceivable ? "bg-income-soft/50 text-income" : "bg-expense-soft/50 text-expense"
        }`}
      >
        <p className="font-semibold">
          {isReceivable ? t("auto.kf48e3aa79d") : t("auto.kebf7b80fd6")} · {debt.person}
        </p>
        <p className="mt-1 text-xs opacity-90">
          {t("auto.k23d4b4c189")}{formatPrice(debt.remainingAmount)} {t("common.of")} {formatPrice(debt.totalAmount)} ·{" "}
          {statusLabel}
        </p>
      </div>
      <p className="text-xs leading-6 text-muted">
        {t("budget.debtLedgerSourceHint", {
          type: isReceivable ? t("auto.kf48e3aa79d") : t("auto.kebf7b80fd6"),
        })}
      </p>
    </div>
  );
}

export function DebtLedgerSection({
  amount,
  value,
  onChange,
}: DebtLedgerSectionProps) {  const { t } = useTranslation();

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
        label: t("budget.settleDebtOptionLabel", {
          person: debt.person,
          type: debtTypeLabel(debt.type),
          amount: formatPrice(debt.remainingAmount),
        }),
      })),
    [openDebts, t],
  );

  const selectedSettleDebt = openDebts.find((debt) => debt._id === value.settleDebtId);

  const modeButtons: { id: DebtLedgerMode; label: string }[] = [
    { id: "create", label: t("auto.k363be5308a") },
    { id: "settle-receivable", label: t("auto.k89319f4b6e") },
    { id: "settle-payable", label: t("auto.kfcaf17b97b") },
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("auto.k801512f58a")}</p>
          <p className="mt-1 text-xs text-muted">
            {t("auto.k1320fa2c46")}
          </p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(selected) => onChange({ enabled: selected })}
          size="sm"
          aria-label={t("auto.k801512f58a")}
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
                  { id: String(DebtType.RECEIVABLE), label: t("auto.kf48e3aa79d") },
                  { id: String(DebtType.PAYABLE), label: t("auto.kebf7b80fd6") },
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
                label={t("auto.k8feed14e36")}
                value={value.person}
                onChange={(person) => onChange({ person })}
                options={persons}
                placeholder={t("auto.kbd05753639")}
              />

              <p className="text-xs leading-6 text-muted">
                {value.debtType === String(DebtType.RECEIVABLE)
                  ? t("auto.k450eea9a96")
                  : t("auto.kaaf9c8c114")}
              </p>
            </div>
          )}

          {isSettleMode(value.mode) && (
            <div className="space-y-3">
              <FormSelect
                label={
                  value.mode === "settle-receivable"
                    ? t("auto.k6c8dc90748")
                    : t("auto.k3ada17889e")
                }
                placeholder={t("auto.keb1dc98120")}
                selectedKey={value.settleDebtId || undefined}
                onSelectionChange={(key) => onChange({ settleDebtId: key })}
                options={settleOptions}
                emptyMessage={
                  value.mode === "settle-receivable"
                    ? t("auto.kdaa386199a")
                    : t("auto.k1b305318d6")
                }
              />

              {selectedSettleDebt && amount && (
                <p className="rounded-xl bg-surface px-3 py-2 text-xs text-muted">
                  {t("auto.k014758aca4")}{" "}
                  <strong className="text-foreground">
                    {formatPrice(
                      Math.min(
                        selectedSettleDebt.remainingAmount,
                        Number(amount.replace(/,/g, "")) || 0,
                      ),
                    )}
                  </strong>{" "} {t("auto.kb0e65eba17")} {formatPrice(selectedSettleDebt.remainingAmount)} {t("auto.k43ef5d91de")}
                  {t("auto.kb2d8ac8e4d")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
