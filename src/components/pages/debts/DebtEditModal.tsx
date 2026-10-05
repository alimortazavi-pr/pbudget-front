"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Switch } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import { resolveBudgetCurrency, resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { IDebt } from "@/common/interfaces/debt.interface";
import { toEnglishDigits } from "@/common/utils";
import { getNowDateParts } from "@/common/utils/calendar-date";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormDatePicker, FormInput, FormPriceInput, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function DebtEditModal({
  debt,
  open,
  onOpenChange,
  onSaved,
}: {
  debt: IDebt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (debt: IDebt) => void;
}) {
  const { t } = useTranslation();
  const calendar = resolveBudgetDateCalendar(debt.dateCalendar);
  const [person, setPerson] = useState(debt.person);
  const [description, setDescription] = useState(debt.description ?? "");
  const [amount, setAmount] = useState(String(debt.totalAmount));
  const [hasDue, setHasDue] = useState(Boolean(debt.dueYear));
  const [due, setDue] = useState({ year: "", month: "", day: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPerson(debt.person);
    setDescription(debt.description ?? "");
    setAmount(String(debt.totalAmount));
    setHasDue(Boolean(debt.dueYear));
    const now = getNowDateParts(calendar);
    setDue(
      debt.dueYear
        ? { year: String(debt.dueYear), month: String(debt.dueMonth), day: String(debt.dueDay) }
        : { year: now.year, month: now.month, day: now.day },
    );
  }, [open, debt, calendar]);

  async function save() {
    setSaving(true);
    try {
      const updated = await debtsApi.updateDebt(debt._id, {
        person: person.trim(),
        description: description.trim(),
        amount: toEnglishDigits(amount),
        ...(hasDue
          ? { dueYear: toEnglishDigits(due.year), dueMonth: toEnglishDigits(due.month), dueDay: toEnglishDigits(due.day) }
          : debt.dueYear
            ? { clearDueDate: "true" as const }
            : {}),
      });
      showToast(t("debts.saved"), "success");
      onSaved(updated);
      onOpenChange(false);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} isDismissable={!saving}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader>
          <Modal.Heading>{t("debts.editDebt")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          <FormInput label={t("debts.person")} value={person} onChange={(event) => setPerson(event.target.value)} />
          <FormPriceInput label={t("common.totalAmount")} value={amount} onChange={setAmount} currency={resolveBudgetCurrency(debt.currency)} />
          <p className="-mt-2 text-xs text-muted">{t("debts.amountLockedHint")}</p>
          <FormTextArea label={t("common.description")} value={description} onChange={(event) => setDescription(event.target.value)} />
          <label className="flex items-center justify-between gap-3 rounded-xl bg-surface-secondary/60 px-3 py-2.5 text-sm">
            <span>
              <span className="block font-medium">{t("debts.setDueDate")}</span>
              <span className="text-xs text-muted">{t("debts.dueDateHint")}</span>
            </span>
            <Switch size="sm" isSelected={hasDue} onChange={setHasDue}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </label>
          {hasDue ? (
            <FormDatePicker
              label={t("debts.dueDate")}
              year={due.year}
              month={due.month}
              day={due.day}
              inModal
              calendarType={calendar}
              onChange={(value) => setDue({ year: value.year, month: value.month, day: value.day })}
            />
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" isDisabled={saving} onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button isPending={saving} isDisabled={!person.trim()} onPress={() => void save()}>
            {t("common.save")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
