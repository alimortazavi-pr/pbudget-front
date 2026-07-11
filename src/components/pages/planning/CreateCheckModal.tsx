"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as checksApi from "@/common/api/checks";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import {
  FormDatePicker,
  FormInput,
  FormPersonComboBox,
  FormPriceInput,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { CheckType } from "@/types/enums";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";

type CreateCheckModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persons: string[];
  onCreated: () => void;
};

export function CreateCheckModal({
  open,
  onOpenChange,
  persons,
  onCreated,
}: CreateCheckModalProps) {
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const now = getJalaliNow();
  const [type, setType] = useState(String(CheckType.PAYABLE));
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("");
  const [bankName, setBankName] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [dueYear, setDueYear] = useState(String(now.jYear()));
  const [dueMonth, setDueMonth] = useState(String(now.jMonth() + 1));
  const [dueDay, setDueDay] = useState(String(now.jDate()));
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fresh = getJalaliNow();
    setDueYear(String(fresh.jYear()));
    setDueMonth(String(fresh.jMonth() + 1));
    setDueDay(String(fresh.jDate()));
  }, [open]);

  function handleDueDateChange(value: {
    year: string;
    month: string;
    day: string;
  }) {
    setDueYear(value.year);
    setDueMonth(value.month);
    setDueDay(value.day);
  }

  async function handleSubmit() {
    if (!person.trim() || !amount.trim()) {
      showToast(t("auto.k34dd4a0b0c"));
      return;
    }

    setSubmitting(true);
    try {
      await checksApi.createCheck({
        type,
        amount: toEnglishDigits(amount),
        person: person.trim(),
        bankName,
        checkNumber,
        dueYear: toEnglishDigits(dueYear),
        dueMonth: toEnglishDigits(dueMonth),
        dueDay: toEnglishDigits(dueDay),
        description,
      });
      showToast(t("auto.k4781ebf878"), "success");
      onCreated();
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{t("auto.k32f84c08aa")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            {[
              { id: String(CheckType.RECEIVABLE), label: t("auto.k1b057b46b9") },
              { id: String(CheckType.PAYABLE), label: t("auto.k0d58ff61f7") },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium ${
                  type === item.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <FormPriceInput label={t("budget.amountWithCurrency", { currency: currencyLabel(preferredCurrency) })} value={amount} onChange={setAmount} />
          <FormPersonComboBox
            label={t("auto.k4617f9a4f6")}
            value={person}
            onChange={setPerson}
            options={persons}
          />
          <FormInput
            label={t("auto.k83e336be2b")}
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <FormInput
            label={t("auto.kdbb09da3c6")}
            value={checkNumber}
            onChange={(e) => setCheckNumber(e.target.value)}
          />
          <FormDatePicker
            label={t("auto.kbe0c3db3c3")}
            year={dueYear}
            month={dueMonth}
            day={dueDay}
            inModal
            onChange={handleDueDateChange}
          />
          <FormTextArea
            label={t("common.description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button isPending={submitting} onPress={() => void handleSubmit()}>
            {t("auto.k1c362cffea")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
