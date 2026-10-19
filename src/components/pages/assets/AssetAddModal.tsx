"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";
import { ArrowRight2 } from "iconsax-reactjs";

import * as assetsApi from "@/common/api/assets";
import * as paymentCardsApi from "@/common/api/payment-cards";
import { ASSET_KIND_META, ASSET_KIND_TILE_ORDER, assetKindMeta } from "@/common/constants/asset-kinds";
import { DEFAULT_USER_PREFERENCES, resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { AssetKind, IAsset } from "@/common/interfaces/asset.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getNowDateParts } from "@/common/utils";
import { sanitizeQuantityInput } from "@/common/utils/asset-format";
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
  /** Skip the first step (used by the empty state tiles). */
  initialKind?: AssetKind | null;
  onOpenChange: (open: boolean) => void;
  onCreated: (asset: IAsset) => void;
};

/** Two steps at most: "what is it?" (big tiles), then one short form. */
export function AssetAddModal({ open, initialKind, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);

  const [kind, setKind] = useState<AssetKind | null>(null);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [total, setTotal] = useState("");
  const [bought, setBought] = useState<"now" | "before">("now");
  const [unitPrice, setUnitPrice] = useState("");
  const [record, setRecord] = useState<AssetRecordValue>(() => ({
    date: getNowDateParts(calendar),
    categoryId: "",
    cardId: "",
  }));
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [saving, setSaving] = useState(false);

  function pickKind(next: AssetKind) {
    setKind(next);
    setTitle(t(`feat.assets.defaultTitle.${next}`));
    setUnit(t(`feat.assets.unit.${next}`));
  }

  useEffect(() => {
    if (!open) return;
    setQuantity("");
    setTotal("");
    setUnitPrice("");
    setBought("now");
    setRecord({ date: getNowDateParts(calendar), categoryId: "", cardId: "" });
    if (initialKind) pickKind(initialKind);
    else setKind(null);
    void paymentCardsApi.fetchPaymentCards().then(setCards).catch(() => setCards([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open]);

  const qty = Number(toEnglishDigits(quantity));
  const totalValue = Number(total);
  const unitName = unit.trim() || t("feat.assets.unitFallback");
  const average = qty > 0 && totalValue > 0 ? totalValue / qty : 0;
  const wallet = getWalletBalance(user, currency);
  const notEnough = bought === "now" && totalValue > 0 && totalValue > wallet;
  const valid = Boolean(kind) && title.trim().length > 0 && qty > 0 && totalValue > 0;

  const meta = useMemo(() => assetKindMeta(kind ?? "other"), [kind]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!kind || !valid) return;
    setSaving(true);
    try {
      const priceValue = Number(unitPrice);
      const asset = await assetsApi.createAsset({
        title: title.trim(),
        kind,
        unit: unit.trim() || undefined,
        unitPrice: priceValue > 0 ? String(priceValue) : undefined,
        trade: {
          quantity: String(qty),
          totalPrice: String(totalValue),
          year: record.date.year,
          month: record.date.month,
          day: record.date.day,
          ...(bought === "now"
            ? {
                recordTransaction: true,
                categoryId: record.categoryId || undefined,
                paymentCardId: record.cardId || undefined,
              }
            : {}),
        },
      });
      showToast(t("feat.assets.created", { title: asset.title }), "success");
      onOpenChange(false);
      onCreated(asset);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
        {!kind ? (
          <>
            <AppModalHeader>
              <Modal.Heading>{t("feat.assets.pickKindTitle")}</Modal.Heading>
              <p className="mt-0.5 text-xs text-muted">{t("feat.assets.pickKindHint")}</p>
            </AppModalHeader>
            <Modal.Body className={modalSheetBodyClass}>
              <div className="grid grid-cols-2 gap-2.5" data-testid="asset-kind-tiles">
                {ASSET_KIND_TILE_ORDER.map((item) => {
                  const itemMeta = ASSET_KIND_META[item];
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => pickKind(item)}
                      className="pb-press flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 bg-surface-secondary/50 p-3 text-start transition-colors hover:border-accent/50 hover:bg-surface-secondary"
                    >
                      <span
                        className="flex size-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${itemMeta.color}22` }}
                      >
                        <itemMeta.icon size={24} variant="Bulk" color={itemMeta.color} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{t(`feat.assets.kind.${item}`)}</span>
                        <span className="block text-[11px] leading-5 text-muted">
                          {t(`feat.assets.kindHint.${item}`)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Modal.Body>
          </>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
            <AppModalHeader>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label={t("common.back")}
                  onClick={() => setKind(null)}
                  className="pb-icon-btn shrink-0"
                >
                  <ArrowRight2 size={18} />
                </button>
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${meta.color}22` }}
                >
                  <meta.icon size={20} variant="Bulk" color={meta.color} />
                </span>
                <Modal.Heading className="truncate">
                  {t("feat.assets.addKindTitle", { kind: t(`feat.assets.kind.${kind}`) })}
                </Modal.Heading>
              </div>
            </AppModalHeader>

            <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
              <FormInput
                label={t("feat.assets.nameLabel")}
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
                <FormInput
                  label={t("feat.assets.howMuchLabel")}
                  value={toPersianDigits(quantity).replace(/\./g, "٫")}
                  inputMode="decimal"
                  dir="ltr"
                  className="text-left"
                  placeholder={toPersianDigits("0")}
                  onChange={(e) => setQuantity(sanitizeQuantityInput(e.target.value))}
                />
                <FormInput
                  label={t("feat.assets.unitLabel")}
                  value={unit}
                  maxLength={20}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <FormPriceInput
                  label={t("feat.assets.totalPaidQuestion")}
                  value={total}
                  onChange={setTotal}
                  currency={currency}
                />
                <p className="min-h-5 text-xs text-muted" data-testid="average-hint">
                  {average > 0
                    ? t("feat.assets.averageLine", { unit: unitName, price: formatPriceWithCurrency(average, currency) })
                    : t("feat.assets.totalHint")}
                </p>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface-secondary p-1" role="radiogroup" aria-label={t("feat.assets.boughtLabel")}>
                  {(["now", "before"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      role="radio"
                      aria-checked={bought === item}
                      onClick={() => setBought(item)}
                      className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                        bought === item
                          ? "bg-surface text-accent shadow-sm ring-1 ring-accent/30"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {t(item === "now" ? "feat.assets.boughtNow" : "feat.assets.boughtBefore")}
                    </button>
                  ))}
                </div>
                {bought === "before" ? (
                  <p className="px-1 text-xs leading-6 text-muted">{t("feat.assets.boughtBeforeHint")}</p>
                ) : null}
              </div>

              {bought === "now" ? (
                <AssetRecordSection side="buy" value={record} onChange={setRecord} cards={cards} />
              ) : null}
              {notEnough ? (
                <p className="rounded-xl bg-surface-secondary px-3 py-2 text-xs leading-6 text-muted" data-testid="wallet-short">
                  {t("feat.assets.walletShort", { amount: formatPriceWithCurrency(wallet, currency) })}
                </p>
              ) : null}

              <div className="space-y-1.5 border-t border-border/40 pt-4">
                <FormPriceInput
                  label={t("feat.assets.todayPriceOptional", { unit: unitName })}
                  value={unitPrice}
                  onChange={setUnitPrice}
                  currency={currency}
                />
                <p className="text-xs leading-6 text-muted">{t("feat.assets.todayPriceHint")}</p>
              </div>
            </Modal.Body>

            <Modal.Footer className={modalSheetFooterClass}>
              <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" isPending={saving} isDisabled={!valid}>
                {t("feat.assets.addSubmit")}
              </Button>
            </Modal.Footer>
          </form>
        )}
      </AppModalDialog>
    </AppModal>
  );
}
