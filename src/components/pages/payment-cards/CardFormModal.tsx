"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as paymentCardsApi from "@/common/api/payment-cards";
import { DEFAULT_CATEGORY_COLORS } from "@/common/constants/category-colors";
import type { UserCurrency } from "@/common/constants/user-preferences";
import type { IAccountBalance, IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatCardNumberDisplay, normalizeCardNumber } from "@/common/utils/payment-card";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { CategoryColorPicker } from "@/components/common/form/CategoryColorPicker";
import { FormInput, FormPriceInput } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
  modalSheetFooterClass,
} from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";

type Props = {
  open: boolean;
  card: IPaymentCard | null;
  /** Start with the "own balance" choice (the "track balance" call to action). */
  startWithBalance?: boolean;
  /** The plan includes separate balances; off = a plain label, no balance choice. */
  balancesEnabled?: boolean;
  balance?: IAccountBalance;
  currency: UserCurrency;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** A name, a colour and one plain choice: just a label for transactions, or an account with its own balance. */
export function CardFormModal({ open, card, startWithBalance, balancesEnabled = true, balance, currency, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [bankName, setBankName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLORS[4]);
  const [mode, setMode] = useState<"label" | "balance">("label");
  const [current, setCurrent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(card?.title ?? "");
    setBankName(card?.bankName ?? "");
    setLastFour(card?.lastFour ?? "");
    setColor(card?.color || DEFAULT_CATEGORY_COLORS[4]);
    setMode(balancesEnabled && (card?.trackBalance || startWithBalance) ? "balance" : "label");
    setCurrent(card?.trackBalance && balance ? String(balance.balance) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill when the dialog opens
  }, [open, card?._id]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const base = {
        title: title.trim(),
        bankName: bankName.trim(),
        lastFour: normalizeCardNumber(lastFour),
        color,
      };
      const typed = toNumber(current);
      if (mode === "label" || !balancesEnabled) {
        if (card) {
          await paymentCardsApi.updatePaymentCard(card._id, { ...base, ...(card.trackBalance && balancesEnabled ? { trackBalance: false } : {}) });
        } else {
          await paymentCardsApi.createPaymentCard(base);
        }
      } else if (!card) {
        await paymentCardsApi.createPaymentCard({ ...base, trackBalance: true, initialBalance: String(typed) });
      } else {
        // The user types what the account holds NOW; the server keeps a starting balance plus
        // everything that happened since, so we work the starting balance out.
        const flow = card.trackBalance && balance ? balance.balance - balance.initialBalance : 0;
        await paymentCardsApi.updatePaymentCard(card._id, {
          ...base,
          trackBalance: true,
          initialBalance: String(typed - flow),
        });
        if (!card.trackBalance) {
          const rows = await paymentCardsApi.fetchAccountBalances();
          const fresh = rows.find((row) => row.cardId === card._id);
          const extra = fresh ? fresh.balance - typed : 0;
          if (fresh && extra !== 0) {
            await paymentCardsApi.updatePaymentCard(card._id, { initialBalance: String(typed - extra) });
          }
        }
      }
      showToast(t("common.saved"), "success");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  const choices = [
    { id: "label" as const, title: t("feat.accounts.modeLabel"), hint: t("feat.accounts.modeLabelHint") },
    { id: "balance" as const, title: t("feat.accounts.modeBalance"), hint: t("feat.accounts.modeBalanceHint") },
  ];

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader>
            <Modal.Heading>{card ? t("feat.accounts.editTitle") : t("feat.accounts.newTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            <FormInput
              label={t("feat.accounts.nameLabel")}
              value={title}
              maxLength={60}
              placeholder={t("feat.accounts.namePlaceholder")}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormInput label={t("feat.accounts.bankLabel")} value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <FormInput
                label={t("feat.accounts.lastFourLabel")}
                value={formatCardNumberDisplay(lastFour)}
                onChange={(e) => setLastFour(normalizeCardNumber(e.target.value))}
                inputMode="numeric"
                maxLength={19}
                dir="ltr"
                className="text-left"
              />
            </div>
            {balancesEnabled ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("feat.accounts.modeQuestion")}</p>
              <div className="grid gap-2" role="radiogroup" aria-label={t("feat.accounts.modeQuestion")}>
                {choices.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={mode === item.id}
                    onClick={() => setMode(item.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-start transition-colors ${
                      mode === item.id ? "border-accent bg-accent/10 ring-1 ring-accent/30" : "border-border/60 bg-surface-secondary/50 hover:border-accent/40"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1 size-4 shrink-0 rounded-full border-2 ${mode === item.id ? "border-accent bg-accent shadow-[inset_0_0_0_3px_var(--surface)]" : "border-border"}`}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{item.title}</span>
                      <span className="mt-0.5 block text-xs leading-6 text-muted">{item.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
              {mode === "balance" ? (
                <div className="space-y-1.5 pt-1">
                  <FormPriceInput
                    label={t("feat.accounts.currentBalance")}
                    value={current}
                    onChange={setCurrent}
                    currency={currency}
                    allowNegative
                  />
                  <p className="text-xs leading-6 text-muted">{t("feat.accounts.currentBalanceHint")}</p>
                </div>
              ) : null}
            </div>
            ) : null}

            <CategoryColorPicker value={color} onChange={setColor} />
          </Modal.Body>
          <Modal.Footer className={modalSheetFooterClass}>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving} isDisabled={!title.trim()}>
              {t("common.save")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
