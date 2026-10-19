"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as assetsApi from "@/common/api/assets";
import * as paymentCardsApi from "@/common/api/payment-cards";
import { DEFAULT_USER_PREFERENCES, resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { IAsset } from "@/common/interfaces/asset.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getNowDateParts } from "@/common/utils";
import { formatQuantity, sanitizeQuantityInput } from "@/common/utils/asset-format";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toEnglishDigits, toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  FormCategoryComboBox,
  FormDatePicker,
  FormInput,
  FormPriceInput,
  FormSelect,
} from "@/components/common/form/FormFields";
import { SwitchRow } from "@/components/common/form/FormKit";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";

type Props = {
  open: boolean;
  asset: IAsset | null;
  side: "buy" | "sell";
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

/** Buy or sell some units. The price is the TOTAL paid or received. */
export function AssetTradeModal({ open, asset, side, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);
  const categoryOptions = getCategorySelectOptions(categories ?? []);

  const [quantity, setQuantity] = useState("");
  const [total, setTotal] = useState("");
  const [date, setDate] = useState(() => getNowDateParts(calendar));
  const [note, setNote] = useState("");
  const [record, setRecord] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuantity("");
    setTotal("");
    setNote("");
    setRecord(false);
    setCategoryId("");
    setCardId("");
    setDate(getNowDateParts(calendar));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when the dialog opens
  }, [open]);

  // Cards are only needed once the user asks to record a transaction.
  useEffect(() => {
    if (!open || !record || cards.length) return;
    void paymentCardsApi.fetchPaymentCards().then(setCards).catch(() => setCards([]));
  }, [open, record, cards.length]);

  const qty = Number(toEnglishDigits(quantity));
  const totalValue = Number(total);
  const perUnit = qty > 0 && totalValue > 0 ? totalValue / qty : 0;
  const tooMuch = side === "sell" && asset ? qty > asset.quantity + 1e-9 : false;
  const valid = qty > 0 && totalValue > 0 && !tooMuch && (!record || Boolean(categoryId));

  const cardOptions = useMemo(
    () => [
      { id: "none", label: t("budget.noCard") },
      ...cards.map((card) => ({ id: card._id, label: card.title })),
    ],
    [cards, t],
  );

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!asset || !valid) return;
    setSaving(true);
    try {
      await assetsApi.createAssetTrade(asset._id, {
        side,
        quantity: String(qty),
        totalPrice: String(totalValue),
        year: String(date.year),
        month: String(date.month),
        day: String(date.day),
        note: note.trim() || undefined,
        ...(record ? { recordTransaction: true, categoryId, paymentCardId: cardId || undefined } : {}),
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

  const unit = asset?.unit ?? "";

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>
              {side === "buy"
                ? t("feat.assets.buyTitle", { title: asset?.title ?? "" })
                : t("feat.assets.sellTitle", { title: asset?.title ?? "" })}
            </Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <FormInput
              label={t("feat.assets.quantityLabel", { unit })}
              value={toPersianDigits(quantity).replace(/\./g, "٫")}
              inputMode="decimal"
              dir="ltr"
              className="text-left"
              onChange={(e) => setQuantity(sanitizeQuantityInput(e.target.value))}
            />
            {side === "sell" && asset ? (
              <p className={`-mt-2 text-xs ${tooMuch ? "text-danger" : "text-muted"}`}>
                {tooMuch
                  ? t("feat.assets.sellTooMuch", { amount: `${formatQuantity(asset.quantity)} ${unit}` })
                  : t("feat.assets.youHold", { amount: `${formatQuantity(asset.quantity)} ${unit}` })}
              </p>
            ) : null}
            <FormPriceInput
              label={side === "buy" ? t("feat.assets.totalPaid") : t("feat.assets.totalReceived")}
              value={total}
              onChange={setTotal}
              currency={currency}
            />
            {perUnit > 0 ? (
              <p className="-mt-2 text-xs text-muted" data-testid="per-unit-hint">
                {t("feat.assets.perUnitHint", { price: formatPriceWithCurrency(perUnit, currency), unit })}
              </p>
            ) : null}
            <FormDatePicker
              label={t("feat.assets.date")}
              year={String(date.year)}
              month={String(date.month)}
              day={String(date.day)}
              inModal
              calendarType={calendar}
              onChange={(value) => setDate({ year: value.year, month: value.month, day: value.day })}
            />
            <FormInput label={t("feat.assets.tradeNote")} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />

            <SwitchRow
              label={t("feat.assets.recordTransaction")}
              description={side === "buy" ? t("feat.assets.recordBuyHint") : t("feat.assets.recordSellHint")}
              selected={record}
              onChange={setRecord}
            />
            {record ? (
              <div className="space-y-4">
                <FormCategoryComboBox
                  label={t("auto.kb561a47a9b")}
                  placeholder={t("common.searchCategoryPlaceholder")}
                  selectedKey={categoryId || undefined}
                  onSelectionChange={(key) => setCategoryId(key)}
                  options={categoryOptions}
                  emptyMessage={t("common.noCategoryRegistered")}
                />
                {cards.length > 0 ? (
                  <FormSelect
                    label={side === "buy" ? t("budget.paymentCardSource") : t("budget.paymentCardDestination")}
                    selectedKey={cardId || "none"}
                    onSelectionChange={(key) => setCardId(key === "none" ? "" : key)}
                    options={cardOptions}
                  />
                ) : null}
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer className="border-t border-border/40 px-5 py-4">
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
