"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import {
  CURRENCY_OPTIONS,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import { useMergedPersons } from "@/common/hooks/useMergedPersons";
import { getNowDateParts, toEnglishDigits } from "@/common/utils";
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

  useEffect(() => {
    if (!open) return;
    const parts = getNowDateParts(formCalendar);
    setCurrency(preferredCurrency);
    setYear(parts.year);
    setMonth(parts.month);
    setDay(parts.day);
  }, [open, formCalendar, preferredCurrency]);

  async function handleSubmit() {
    if (!person.trim() || !amount.trim() || !category) {
      showToast(t("auto.k0abe282ca2"));
      return;
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
                onClick={() => setDebtType(item.id)}
                className={`flex-1 cursor-pointer px-3 py-2 text-sm ${optionClass(debtType === item.id)}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <FormPersonComboBox
            label={t("auto.k8feed14e36")}
            value={person}
            onChange={setPerson}
            options={persons}
          />

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
