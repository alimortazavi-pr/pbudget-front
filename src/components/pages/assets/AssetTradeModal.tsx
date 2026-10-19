"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as assetsApi from "@/common/api/assets";
import * as paymentCardsApi from "@/common/api/payment-cards";
import { assetKindMeta } from "@/common/constants/asset-kinds";
import { DEFAULT_USER_PREFERENCES, resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { IAsset } from "@/common/interfaces/asset.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getNowDateParts } from "@/common/utils";
import { formatQuantity, sanitizeQuantityInput } from "@/common/utils/asset-format";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toEnglishDigits, toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { FormInput, FormPriceInput } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
  modalSheetFooterClass,
} from "@/components/common/ui/AppModal";
import { AssetRecordSection, type AssetRecordValue } from "@/components/pages/assets/AssetRecordSection";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Props = {
  open: boolean;
  asset: IAsset | null;
  side: "buy" | "sell";
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function sameDay(date: { year: string; month: string; day: string }, now: { year: string; month: string; day: string }) {
  return date.year === now.year && date.month === now.month && date.day === now.day;
}

/** Buy or sell some units. The price is the TOTAL paid or received. */
export function AssetTradeModal({ open, asset, side, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);

  const [quantity, setQuantity] = useState("");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [record, setRecord] = useState(true);
  const [recordTouched, setRecordTouched] = useState(false);
  const [options, setOptions] = useState<AssetRecordValue>(() => ({
    date: getNowDateParts(calendar),
    categoryId: "",
    cardId: "",
  }));
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuantity("");
    setTotal("");
    setNote("");
    setRecord(true);
    setRecordTouched(false);
    setOptions({ date: getNowDateParts(calendar), categoryId: "", cardId: "" });
    void paymentCardsApi.fetchPaymentCards().then(setCards).catch(() => setCards([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when the dialog opens
  }, [open]);

  const unit = asset?.unit ?? "";
  const held = asset?.quantity ?? 0;
  const qty = Number(toEnglishDigits(quantity));
  const totalValue = Number(total);
  const perUnit = qty > 0 && totalValue > 0 ? totalValue / qty : 0;
  const tooMuch = side === "sell" && qty > held + 1e-9;
  const wallet = getWalletBalance(user, currency);
  const notEnough = side === "buy" && record && totalValue > 0 && totalValue > wallet;
  const valid = qty > 0 && totalValue > 0 && !tooMuch && !notEnough;
  const kindMeta = assetKindMeta(asset?.kind ?? "other");

  // A past date is usually a bookkeeping entry, so it is not recorded in the wallet by default.
  function changeOptions(next: AssetRecordValue) {
    setOptions(next);
    if (!recordTouched) setRecord(sameDay(next.date, getNowDateParts(calendar)));
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!asset || !valid) return;
    setSaving(true);
    try {
      await assetsApi.createAssetTrade(asset._id, {
        side,
        quantity: String(qty),
        totalPrice: String(totalValue),
        year: options.date.year,
        month: options.date.month,
        day: options.date.day,
        note: note.trim() || undefined,
        ...(record
          ? {
              recordTransaction: true,
              categoryId: options.categoryId || undefined,
              paymentCardId: options.cardId || undefined,
            }
          : {}),
      });
      showToast(side === "buy" ? t("feat.assets.buyDone") : t("feat.assets.sellDone"), "success");
      onOpenChange(false);
      onSaved();
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
            <div className="flex items-center gap-2.5">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${kindMeta.color}22` }}
              >
                <kindMeta.icon size={20} variant="Bulk" color={kindMeta.color} />
              </span>
              <div className="min-w-0">
                <Modal.Heading className="truncate">
                  {side === "buy"
                    ? t("feat.assets.buyTitle", { title: asset?.title ?? "" })
                    : t("feat.assets.sellTitle", { title: asset?.title ?? "" })}
                </Modal.Heading>
                <p className="text-xs text-muted">
                  {t("feat.assets.youHold", { amount: `${formatQuantity(held)} ${unit}` })}
                </p>
              </div>
            </div>
          </AppModalHeader>

          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            <div className="space-y-1.5">
              <FormInput
                label={t(side === "buy" ? "feat.assets.buyQuantityLabel" : "feat.assets.sellQuantityLabel", { unit })}
                value={toPersianDigits(quantity).replace(/\./g, "٫")}
                inputMode="decimal"
                dir="ltr"
                className="text-left"
                placeholder={toPersianDigits("0")}
                onChange={(e) => setQuantity(sanitizeQuantityInput(e.target.value))}
              />
              {side === "sell" ? (
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs ${tooMuch ? "text-danger" : "text-muted"}`}>
                    {tooMuch
                      ? t("feat.assets.sellTooMuch", { amount: `${formatQuantity(held)} ${unit}` })
                      : ""}
                  </p>
                  {held > 0 ? (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold text-accent hover:underline"
                      onClick={() => setQuantity(String(held))}
                    >
                      {t("feat.assets.sellAll")}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <FormPriceInput
                label={side === "buy" ? t("feat.assets.buyTotalLabel") : t("feat.assets.sellTotalLabel")}
                value={total}
                onChange={setTotal}
                currency={currency}
              />
              <p className="min-h-5 text-xs text-muted" data-testid="per-unit-hint">
                {perUnit > 0
                  ? t("feat.assets.perUnitHint", { unit, price: formatPriceWithCurrency(perUnit, currency) })
                  : t(side === "buy" ? "feat.assets.totalHint" : "feat.assets.totalHintSell")}
              </p>
            </div>

            <AssetRecordSection
              side={side}
              value={options}
              onChange={changeOptions}
              cards={cards}
              toggle={{
                record,
                onChange: (next) => {
                  setRecordTouched(true);
                  setRecord(next);
                },
              }}
            />
            {notEnough ? (
              <p className="rounded-xl bg-expense-soft px-3 py-2 text-xs leading-6 text-expense" data-testid="wallet-short">
                {t("feat.assets.walletShort", { amount: formatPriceWithCurrency(wallet, currency) })}
              </p>
            ) : null}

            <FormInput
              label={t("feat.assets.tradeNote")}
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
            />
          </Modal.Body>

          <Modal.Footer className={modalSheetFooterClass}>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving} isDisabled={!valid}>
              {side === "buy" ? t("feat.assets.buy") : t("feat.assets.sell")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
