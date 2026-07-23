"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Modal } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import { PATHS } from "@/common/constants";
import {
  CURRENCY_OPTIONS,
  resolveBudgetCurrency,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import { useMergedPersons } from "@/common/hooks/useMergedPersons";
import type { IDebt } from "@/common/interfaces/debt.interface";
import {
  formatPriceWithCurrency,
  getNowDateParts,
  toEnglishDigits,
} from "@/common/utils";
import { fetchOpenDebtsForPerson } from "@/common/utils/debt-person-match";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  FormCategoryComboBox,
  FormDatePicker,
  FormPersonComboBox,
  FormPriceInput,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { DebtType } from "@/types/enums";
import { userSelector } from "@/stores/profile";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";

type CreateDebtModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (debtId: string) => void;
};

function optionClass(selected: boolean) {
  return `rounded-xl border transition-colors ${
    selected
      ? "border-accent bg-accent/15 text-accent font-semibold shadow-sm ring-1 ring-accent/35"
      : "border-border/50 bg-surface-secondary/60 text-muted hover:border-accent/40"
  }`;
}

export function CreateDebtModal({ open, onOpenChange, onCreated }: CreateDebtModalProps) {
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const formCalendar = user?.preferences?.dateCalendar ?? "jalali";
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const persons = useMergedPersons(open);
  const nowParts = getNowDateParts(formCalendar);

  const [debtType, setDebtType] = useState(String(DebtType.PAYABLE));
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<UserCurrency>(preferredCurrency);
  const [category, setCategory] = useState("");
  const [year, setYear] = useState(nowParts.year);
  const [month, setMonth] = useState(nowParts.month);
  const [day, setDay] = useState(nowParts.day);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forceCreateNew, setForceCreateNew] = useState(false);
  const [personMatches, setPersonMatches] = useState<IDebt[]>([]);
  const [checkingPerson, setCheckingPerson] = useState(false);

  useEffect(() => {
    if (!open) return;
    const parts = getNowDateParts(formCalendar);
    setCurrency(preferredCurrency);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
    setForceCreateNew(false);
    setPersonMatches([]);
  }, [open, formCalendar, preferredCurrency]);

  useEffect(() => {
    if (!open) return;
    const trimmed = person.trim();
    if (!trimmed || forceCreateNew) {
      setPersonMatches([]);
      return;
    }

    let cancelled = false;
    setCheckingPerson(true);
    const timer = window.setTimeout(() => {
      void fetchOpenDebtsForPerson(debtsApi.fetchDebts, trimmed, debtType)
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
  }, [open, person, debtType, forceCreateNew]);

  async function handleSubmit() {
    if (!person.trim() || !amount.trim() || !category) {
      showToast(t("auto.k0abe282ca2"));
      return;
    }

    if (!forceCreateNew) {
      const matches = await fetchOpenDebtsForPerson(
        debtsApi.fetchDebts,
        person,
        debtType,
      );
      if (matches.length > 0) {
        setPersonMatches(matches);
        showToast(
          t("debts.chooseLinkOrCreate", {
            count: matches.length,
            person: person.trim(),
          }),
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const debt = await debtsApi.createStandaloneDebt({
        type: debtType,
        person: person.trim(),
        amount: toEnglishDigits(amount),
        currency,
        dateCalendar: formCalendar,
        category,
        year: toEnglishDigits(year),
        month: toEnglishDigits(month),
        day: toEnglishDigits(day),
        description: description.trim(),
      });
      showToast(t("auto.k89c1a0f1f5"), "success");
      onCreated?.(debt._id);
      onOpenChange(false);
      setPerson("");
      setAmount("");
      setCategory("");
      setDescription("");
      setForceCreateNew(false);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{t("auto.k8d1417e166")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="max-h-[70vh] space-y-4 overflow-x-visible overflow-y-auto overscroll-contain">
          <p className="text-sm text-muted">
            {t(
              t("auto.k844ff58c8f"),
            )}
          </p>

          <div className="flex gap-2">
            {[
              { id: String(DebtType.RECEIVABLE), label: t("common.receivable") },
              { id: String(DebtType.PAYABLE), label: t("common.payable") },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDebtType(item.id);
                  setForceCreateNew(false);
                }}
                className={`flex-1 cursor-pointer px-3 py-2 text-sm ${optionClass(debtType === item.id)}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <FormPersonComboBox
            label={t("auto.k8feed14e36")}
            value={person}
            onChange={(next) => {
              setPerson(next);
              setForceCreateNew(false);
            }}
            options={persons}
          />

          {checkingPerson ? (
            <p className="text-xs text-muted">{t("common.loading")}</p>
          ) : null}

          {personMatches.length > 0 && !forceCreateNew ? (
            <div className="space-y-3 rounded-xl border border-accent/40 bg-accent/5 p-3">
              <div>
                <p className="text-sm font-semibold text-accent">
                  {t("debts.existingActiveTitle", {
                    count: personMatches.length,
                    person: person.trim(),
                  })}
                </p>
                <p className="mt-1 text-xs leading-6 text-muted">
                  {t("debts.existingActiveHint")}
                </p>
              </div>

              <ul className="space-y-2">
                {personMatches.map((debt) => (
                  <li key={debt._id}>
                    <Link
                      href={PATHS.DEBT(debt._id)}
                      className="block rounded-xl border border-border bg-surface px-3 py-2.5 transition hover:border-accent/50"
                      onClick={() => onOpenChange(false)}
                    >
                      <p className="text-sm font-medium">
                        {debt.type === DebtType.RECEIVABLE
                          ? t("common.receivable")
                          : t("common.payable")}{" "}
                        ·{" "}
                        {formatPriceWithCurrency(
                          debt.remainingAmount,
                          resolveBudgetCurrency(debt.currency),
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t("debts.linkToExisting")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setForceCreateNew(true)}
                className={`w-full cursor-pointer px-3 py-2.5 text-sm ${optionClass(false)}`}
              >
                {t("debts.createNewAnyway")}
              </button>
            </div>
          ) : null}

          {forceCreateNew && personMatches.length > 0 ? (
            <p className="rounded-xl bg-surface-secondary px-3 py-2 text-xs text-muted">
              {t("debts.creatingNewConfirmed")}{" "}
              <button
                type="button"
                className="cursor-pointer font-medium text-accent underline-offset-2 hover:underline"
                onClick={() => setForceCreateNew(false)}
              >
                {t("debts.showExistingAgain")}
              </button>
            </p>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium">{t("common.currencyType")}</p>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCY_OPTIONS.map((option) => {
                const selected = currency === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    className={`cursor-pointer px-3 py-2.5 text-sm ${optionClass(selected)}`}
                    onClick={() => setCurrency(option.id)}
                  >
                    {currencyLabel(option.id)}
                  </button>
                );
              })}
            </div>
          </div>

          <FormPriceInput
            label={`${t("common.amount")} (${currencyLabel(currency)})`}
            value={amount}
            onChange={setAmount}
            currency={currency}
          />
          <FormCategoryComboBox
            label={t("auto.kb561a47a9b")}
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
          />
          <FormTextArea
            label={t("common.description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormDatePicker
            label={
              formCalendar === "gregorian"
                ? t("budget.dateGregorian")
                : t("budget.dateJalali")
            }
            year={year}
            month={month}
            day={day}
            inModal
            calendarType={formCalendar}
            onChange={(value) => {
              setYear(value.year);
              setMonth(value.month);
              setDay(value.day);
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button isPending={submitting} onPress={() => void handleSubmit()}>
            {t("common.create")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
