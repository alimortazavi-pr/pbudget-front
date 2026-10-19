"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as paymentCardsApi from "@/common/api/payment-cards";
import type { UserCurrency } from "@/common/constants/user-preferences";
import { resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getNowDateParts } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  FormDatePicker,
  FormInput,
  FormPriceInput,
  FormSelect,
} from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accounts that track their balance. */
  cards: IPaymentCard[];
  currency: UserCurrency;
  onDone: () => void;
};

/** Moves money between two tracked accounts. The wallet total never changes. */
export function AccountTransferModal({ open, onOpenChange, cards, currency, onDone }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => getNowDateParts(calendar));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFromId(cards[0]?._id ?? "");
    setToId(cards[1]?._id ?? "");
    setAmount("");
    setDescription("");
    setDate(getNowDateParts(calendar));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open]);

  const options = useMemo(
    () => cards.map((card) => ({ id: card._id, label: card.title })),
    [cards],
  );
  const valid = Boolean(fromId && toId && fromId !== toId && Number(amount) > 0);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      await paymentCardsApi.createAccountTransfer({
        fromCardId: fromId,
        toCardId: toId,
        amount: String(Number(amount)),
        year: String(date.year),
        month: String(date.month),
        day: String(date.day),
        description: description.trim() || undefined,
      });
      showToast(t("feat.accounts.transferDone"), "success");
      onOpenChange(false);
      onDone();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="sm:max-w-md">
        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{t("feat.accounts.transferAction")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <p className="text-xs leading-6 text-muted">{t("feat.accounts.transferHint")}</p>
            <FormSelect
              label={t("feat.accounts.from")}
              selectedKey={fromId}
              onSelectionChange={setFromId}
              options={options}
            />
            <FormSelect
              label={t("feat.accounts.to")}
              selectedKey={toId}
              onSelectionChange={setToId}
              options={options}
            />
            {fromId && fromId === toId ? (
              <p className="text-xs text-danger">{t("feat.accounts.sameAccount")}</p>
            ) : null}
            <FormPriceInput
              label={t("feat.accounts.amount")}
              value={amount}
              onChange={setAmount}
              currency={currency}
            />
            <FormDatePicker
              label={t("feat.accounts.date")}
              year={String(date.year)}
              month={String(date.month)}
              day={String(date.day)}
              inModal
              calendarType={calendar}
              onChange={(value) => setDate({ year: value.year, month: value.month, day: value.day })}
            />
            <FormInput
              label={t("feat.accounts.note")}
              value={description}
              maxLength={200}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving} isDisabled={!valid}>
              {t("feat.accounts.transferSubmit")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
