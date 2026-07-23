"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import { useMergedPersons } from "@/common/hooks/useMergedPersons";
import type { IDebt } from "@/common/interfaces/debt.interface";
import { resolveBudgetCurrency } from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { fetchOpenDebtsForPerson } from "@/common/utils/debt-person-match";
import { FormPersonComboBox, FormSelect } from "@/components/common/form/FormFields";
import { DebtType } from "@/types/enums";

export type DebtLedgerMode = "create" | "settle-receivable" | "settle-payable";

export type DebtLedgerValue = {
  enabled: boolean;
  mode: DebtLedgerMode;
  debtType: string;
  person: string;
  settleDebtId: string;
  /** User confirmed creating a new debt despite existing open ones for this person */
  forceCreateNew: boolean;
};

type DebtLedgerSectionProps = {
  amount: string;
  value: DebtLedgerValue;
  onChange: (patch: Partial<DebtLedgerValue>) => void;
  /** Currency of the transaction being created/edited — used to isolate debt matches */
  formCurrency?: import("@/common/constants/user-preferences").UserCurrency;
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
  const currency = resolveBudgetCurrency(debt.currency);

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
          {t("auto.k23d4b4c189")}
          {formatPriceWithCurrency(debt.remainingAmount, currency)} {t("common.of")}{" "}
          {formatPriceWithCurrency(debt.totalAmount, currency)} · {statusLabel}
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

function optionClass(selected: boolean) {
  return `rounded-xl border transition-colors ${
    selected
      ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm ring-1 ring-accent/35"
      : "border-border bg-surface text-muted hover:border-accent/40"
  }`;
}

export function DebtLedgerSection({
  amount,
  value,
  onChange,
  formCurrency = "toman",
}: DebtLedgerSectionProps) {
  const { t } = useTranslation();

  const persons = useMergedPersons(value.enabled);
  const [openDebts, setOpenDebts] = useState<IDebt[]>([]);
  const [personMatches, setPersonMatches] = useState<IDebt[]>([]);
  const [checkingPerson, setCheckingPerson] = useState(false);

  const settleDebtType =
    value.mode === "settle-receivable" ? DebtType.RECEIVABLE : DebtType.PAYABLE;

  useEffect(() => {
    if (!value.enabled || !isSettleMode(value.mode)) return;
    void debtsApi
      .fetchDebts({
        status: "open",
        type: String(settleDebtType),
        currency: formCurrency,
      })
      .then((res) => setOpenDebts(res.debts))
      .catch(() => setOpenDebts([]));
  }, [value.enabled, value.mode, settleDebtType, formCurrency]);

  useEffect(() => {
    if (!value.enabled || value.mode !== "create") {
      setPersonMatches([]);
      return;
    }

    const person = value.person.trim();
    if (!person || value.forceCreateNew) {
      setPersonMatches([]);
      return;
    }

    let cancelled = false;
    setCheckingPerson(true);
    const timer = window.setTimeout(() => {
      void fetchOpenDebtsForPerson(
        debtsApi.fetchDebts,
        person,
        value.debtType,
        formCurrency,
      )
        .then((matches) => {
          if (!cancelled) setPersonMatches(matches);
        })
        .catch(() => {
          if (!cancelled) setPersonMatches([]);
        })
        .finally(() => {
          if (!cancelled) setCheckingPerson(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    value.enabled,
    value.mode,
    value.person,
    value.debtType,
    value.forceCreateNew,
    formCurrency,
  ]);

  const settleOptions = useMemo(
    () =>
      openDebts.map((debt) => ({
        id: debt._id,
        label: t("budget.settleDebtOptionLabel", {
          person: debt.person,
          type: debtTypeLabel(debt.type),
          amount: formatPriceWithCurrency(
            debt.remainingAmount,
            resolveBudgetCurrency(debt.currency),
          ),
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

  function handlePersonChange(person: string) {
    onChange({ person, forceCreateNew: false });
  }

  function linkToExisting(debt: IDebt) {
    onChange({
      mode:
        debt.type === DebtType.RECEIVABLE
          ? "settle-receivable"
          : "settle-payable",
      settleDebtId: debt._id,
      person: debt.person,
      debtType: String(debt.type),
      forceCreateNew: false,
    });
  }

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
                onClick={() =>
                  onChange({
                    mode: item.id,
                    forceCreateNew: item.id === "create" ? value.forceCreateNew : false,
                  })
                }
                className={`cursor-pointer px-3 py-2 text-sm font-medium ${
                  item.id === "create" ? "col-span-2" : ""
                } ${optionClass(value.mode === item.id)}`}
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
                    onClick={() =>
                      onChange({ debtType: item.id, forceCreateNew: false })
                    }
                    className={`flex-1 cursor-pointer px-3 py-2 text-sm font-medium ${optionClass(
                      value.debtType === item.id,
                    )}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <FormPersonComboBox
                label={t("auto.k8feed14e36")}
                value={value.person}
                onChange={handlePersonChange}
                options={persons}
                placeholder={t("auto.kbd05753639")}
              />

              {checkingPerson ? (
                <p className="text-xs text-muted">{t("common.loading")}</p>
              ) : null}

              {personMatches.length > 0 && !value.forceCreateNew ? (
                <div className="space-y-3 rounded-xl border border-accent/40 bg-accent/5 p-3">
                  <div>
                    <p className="text-sm font-semibold text-accent">
                      {t("debts.existingActiveTitle", {
                        count: personMatches.length,
                        person: value.person.trim(),
                      })}
                    </p>
                    <p className="mt-1 text-xs leading-6 text-muted">
                      {t("debts.existingActiveHint")}
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {personMatches.map((debt) => (
                      <li key={debt._id}>
                        <button
                          type="button"
                          onClick={() => linkToExisting(debt)}
                          className="w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2.5 text-start transition hover:border-accent/50"
                        >
                          <p className="text-sm font-medium">
                            {debtTypeLabel(debt.type)} ·{" "}
                            {formatPriceWithCurrency(
                              debt.remainingAmount,
                              resolveBudgetCurrency(debt.currency),
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {t("debts.linkToExisting")}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => onChange({ forceCreateNew: true })}
                    className={`w-full cursor-pointer px-3 py-2.5 text-sm ${optionClass(false)}`}
                  >
                    {t("debts.createNewAnyway")}
                  </button>
                </div>
              ) : null}

              {value.forceCreateNew && personMatches.length > 0 ? (
                <p className="rounded-xl bg-surface px-3 py-2 text-xs text-muted">
                  {t("debts.creatingNewConfirmed")}
                  {" "}
                  <button
                    type="button"
                    className="cursor-pointer font-medium text-accent underline-offset-2 hover:underline"
                    onClick={() => onChange({ forceCreateNew: false })}
                  >
                    {t("debts.showExistingAgain")}
                  </button>
                </p>
              ) : null}

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
                    {formatPriceWithCurrency(
                      Math.min(
                        selectedSettleDebt.remainingAmount,
                        Number(amount.replace(/,/g, "")) || 0,
                      ),
                      resolveBudgetCurrency(selectedSettleDebt.currency),
                    )}
                  </strong>{" "}
                  {t("auto.kb0e65eba17")}{" "}
                  {formatPriceWithCurrency(
                    selectedSettleDebt.remainingAmount,
                    resolveBudgetCurrency(selectedSettleDebt.currency),
                  )}{" "}
                  {t("auto.k43ef5d91de")}
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
