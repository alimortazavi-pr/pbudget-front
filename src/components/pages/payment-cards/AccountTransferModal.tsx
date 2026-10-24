"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as paymentCardsApi from "@/common/api/payment-cards";
import type { UserCurrency } from "@/common/constants/user-preferences";
import { resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { IAccountBalance, IAccountTransfer, IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getNowDateParts } from "@/common/utils";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  FormDatePicker,
  FormInput,
  FormPriceInput,
  FormSelect,
} from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
  modalSheetFooterClass,
} from "@/components/common/ui/AppModal";
import { ArrowSwapVertical } from "iconsax-reactjs";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Accounts that track their balance. */
  cards: IPaymentCard[];
  balances: Map<string, IAccountBalance>;
  defaultFromId?: string;
  currency: UserCurrency;
  onDone: () => void;
  /** Edit this transfer instead of creating a new one. */
  editing?: IAccountTransfer | null;
};

/** Moves money between two tracked accounts. The wallet total never changes. */
export function AccountTransferModal({ open, onOpenChange, cards, balances, defaultFromId, currency, onDone, editing }: Props) {
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
    if (editing) {
      setFromId(editing.fromCard);
      setToId(editing.toCard);
      setAmount(String(editing.amount));
      setDescription(editing.description ?? "");
      setDate({ year: String(editing.year), month: String(editing.month), day: String(editing.day) });
      return;
    }
    const from = cards.find((card) => card._id === defaultFromId) ?? cards[0];
    setFromId(from?._id ?? "");
    setToId(cards.find((card) => card._id !== from?._id)?._id ?? "");
    setAmount("");
    setDescription("");
    setDate(getNowDateParts(calendar));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open]);

  const options = useMemo(
    () =>
      cards.map((card) => ({
        id: card._id,
        label: t("feat.accounts.optionBalance", {
          title: card.title,
          amount: formatPriceWithCurrency(balances.get(card._id)?.balance ?? 0, currency),
        }),
      })),
    [cards, balances, currency, t],
  );
  const valid = Boolean(fromId && toId && fromId !== toId && Number(amount) > 0);
  // Editing: this transfer is already in the balance, so add it back first.
  const fromBalance =
    balances.get(fromId)?.balance === undefined
      ? undefined
      : (balances.get(fromId)?.balance ?? 0) + (editing && editing.fromCard === fromId ? editing.amount : 0);
  const goesNegative = fromBalance !== undefined && Number(amount) > fromBalance;
  const fromTitle = cards.find((card) => card._id === fromId)?.title ?? "";

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      const payload = {
        fromCardId: fromId,
        toCardId: toId,
        amount: String(Number(amount)),
        year: String(date.year),
        month: String(date.month),
        day: String(date.day),
        description: description.trim() || (editing ? "" : undefined),
      };
      if (editing) await paymentCardsApi.updateAccountTransfer(editing._id, payload);
      else await paymentCardsApi.createAccountTransfer(payload);
      showToast(editing ? "انتقال ویرایش شد" : t("feat.accounts.transferDone"), "success");
      onOpenChange(false);
      onDone();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader>
            <Modal.Heading>{editing ? "ویرایش انتقال" : t("feat.accounts.transferAction")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            <div className="space-y-2">
              <FormSelect label={t("feat.accounts.from")} selectedKey={fromId} onSelectionChange={setFromId} options={options} />
              <div className="flex justify-center">
                <button
                  type="button"
                  className="pb-icon-btn !size-8 border border-border/60"
                  aria-label={t("feat.accounts.swap")}
                  onClick={() => {
                    setFromId(toId);
                    setToId(fromId);
                  }}
                >
                  <ArrowSwapVertical size={16} />
                </button>
              </div>
              <FormSelect label={t("feat.accounts.to")} selectedKey={toId} onSelectionChange={setToId} options={options} />
            </div>
            {fromId && fromId === toId ? <p className="text-xs text-danger">{t("feat.accounts.sameAccount")}</p> : null}
            <div className="space-y-1.5">
              <FormPriceInput label={t("feat.accounts.amount")} value={amount} onChange={setAmount} currency={currency} />
              {goesNegative && valid ? (
                <p className="text-xs leading-6 text-muted">{t("feat.accounts.goesNegative", { title: fromTitle })}</p>
              ) : null}
            </div>
            <FormDatePicker
              label={t("feat.accounts.date")}
              year={String(date.year)}
              month={String(date.month)}
              day={String(date.day)}
              inModal
              calendarType={calendar}
              onChange={(value) => setDate({ year: value.year, month: value.month, day: value.day })}
            />
            <FormInput label={t("feat.accounts.note")} value={description} maxLength={200} onChange={(e) => setDescription(e.target.value)} />
            <p className="text-xs leading-6 text-muted">{t("feat.accounts.transferHint")}</p>
          </Modal.Body>
          <Modal.Footer className={modalSheetFooterClass}>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving} isDisabled={!valid}>
              {editing ? t("common.save") : t("feat.accounts.transferSubmit")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
