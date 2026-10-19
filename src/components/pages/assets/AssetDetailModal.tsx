"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Edit2, Trash } from "iconsax-reactjs";

import * as assetsApi from "@/common/api/assets";
import { assetKindMeta } from "@/common/constants/asset-kinds";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IAsset, IAssetTrade } from "@/common/interfaces/asset.interface";
import { formatPercent, formatQuantity } from "@/common/utils/asset-format";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { formatIsoDateJalali } from "@/common/utils/jalali-date";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormPriceInput } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
} from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Props = {
  open: boolean;
  asset: IAsset | null;
  /** Bump to reload the trades (after a buy / sell / delete). */
  refreshKey: number;
  onOpenChange: (open: boolean) => void;
  onTrade: (side: "buy" | "sell") => void;
  onEdit: () => void;
  onRemove: () => void;
  onRemoveTrade: (trade: IAssetTrade) => void;
  onPriceSaved: () => void;
};

export function AssetDetailModal({
  open,
  asset,
  refreshKey,
  onOpenChange,
  onTrade,
  onEdit,
  onRemove,
  onRemoveTrade,
  onPriceSaved,
}: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const [trades, setTrades] = useState<IAssetTrade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [price, setPrice] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const assetId = asset?._id;

  const loadTrades = useCallback(async () => {
    if (!assetId) return;
    setLoadingTrades(true);
    try {
      setTrades(await assetsApi.fetchAssetTrades(assetId));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoadingTrades(false);
    }
  }, [assetId]);

  useEffect(() => {
    if (open) void loadTrades();
  }, [open, loadTrades, refreshKey]);

  useEffect(() => {
    if (open && asset) setPrice(asset.unitPrice > 0 ? String(asset.unitPrice) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fill only when opened or after a refresh
  }, [open, assetId, asset?.unitPrice]);

  if (!asset) return null;
  const meta = assetKindMeta(asset.kind);
  const profitPercent = asset.profit != null && asset.costBasis > 0 ? (asset.profit / asset.costBasis) * 100 : null;
  const priceChanged = price !== "" && Number(price) !== asset.unitPrice;

  async function savePrice() {
    if (!asset) return;
    setSavingPrice(true);
    try {
      await assetsApi.updateAsset(asset._id, { unitPrice: String(Number(price)) });
      showToast(t("feat.assets.priceSaved"), "success");
      onPriceSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSavingPrice(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.color}22` }}
            >
              <meta.icon size={22} variant="Bulk" color={meta.color} />
            </span>
            <div className="min-w-0">
              <Modal.Heading className="truncate">{asset.title}</Modal.Heading>
              <p className="text-xs text-muted">{t(`feat.assets.kind.${asset.kind}`)}</p>
            </div>
          </div>
        </AppModalHeader>

        <Modal.Body className={`${modalSheetBodyClass} space-y-5`}>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label={t("feat.assets.holding")} value={`${formatQuantity(asset.quantity)} ${asset.unit}`} />
            <Stat
              label={t("feat.assets.value")}
              value={asset.unitPrice > 0 ? formatPriceWithCurrency(asset.value, currency) : "—"}
            />
            <Stat label={t("feat.assets.cost")} value={formatPriceWithCurrency(asset.costBasis, currency)} />
            <Stat
              label={t("feat.assets.profit")}
              value={
                asset.profit == null
                  ? "—"
                  : `${asset.profit > 0 ? "+" : asset.profit < 0 ? "−" : ""}${formatPriceWithCurrency(Math.abs(asset.profit), currency)}`
              }
              tone={asset.profit == null ? undefined : asset.profit >= 0 ? "up" : "down"}
              sub={profitPercent != null ? `${formatPercent(profitPercent)}٪` : undefined}
            />
          </div>

          <section className="space-y-2 rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
            <FormPriceInput
              label={t("feat.assets.currentPrice", { unit: asset.unit })}
              value={price}
              onChange={setPrice}
              currency={currency}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted">
                {asset.priceUpdatedAt
                  ? t("feat.assets.priceUpdatedAt", { date: formatIsoDateJalali(asset.priceUpdatedAt) })
                  : t("feat.assets.noPriceYet")}
              </p>
              <Button size="sm" isDisabled={!priceChanged} isPending={savingPrice} onPress={() => void savePrice()}>
                {t("feat.assets.updatePrice")}
              </Button>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Button onPress={() => onTrade("buy")}>{t("feat.assets.buy")}</Button>
            <Button variant="secondary" isDisabled={asset.quantity <= 0} onPress={() => onTrade("sell")}>
              {t("feat.assets.sell")}
            </Button>
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-bold">{t("feat.assets.trades")}</h3>
            {loadingTrades && !trades.length ? (
              <div className="pb-shimmer h-16 rounded-xl" aria-hidden />
            ) : trades.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted">
                {t("feat.assets.noTrades")}
              </p>
            ) : (
              <ul className="divide-y divide-border/40 rounded-xl border border-border/50">
                {trades.map((trade) => (
                  <li key={trade._id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        <span className={trade.side === "buy" ? "text-success" : "text-danger"}>
                          {trade.side === "buy" ? t("feat.assets.buy") : t("feat.assets.sell")}
                        </span>{" "}
                        {formatQuantity(trade.quantity)} {asset.unit}
                      </p>
                      <p className="text-xs text-muted">
                        {toPersianDigits(`${trade.year}/${String(trade.month).padStart(2, "0")}/${String(trade.day).padStart(2, "0")}`)}
                        {trade.quantity > 0
                          ? ` · ${t("feat.assets.perUnitShort", { price: formatPriceWithCurrency(trade.totalPrice / trade.quantity, currency) })}`
                          : ""}
                        {trade.budget ? ` · ${t("feat.assets.inTransactions")}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="text-sm font-semibold">{formatPriceWithCurrency(trade.totalPrice, currency)}</span>
                      <Button isIconOnly size="sm" variant="ghost" aria-label={t("common.delete")} onPress={() => onRemoveTrade(trade)}>
                        <Trash size={15} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Modal.Body>

        <Modal.Footer className="flex-row justify-between border-t border-border/40 px-5 py-3">
          <Button variant="ghost" onPress={onEdit}>
            <Edit2 size={16} />
            {t("common.edit")}
          </Button>
          <Button variant="danger" onPress={onRemove}>
            <Trash size={16} />
            {t("feat.assets.remove")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}

function Stat({ label, value, tone, sub }: { label: string; value: string; tone?: "up" | "down"; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface-secondary/60 px-3 py-2.5">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-0.5 break-words text-sm font-bold ${tone === "up" ? "text-success" : tone === "down" ? "text-danger" : ""}`}>
        {value}
        {sub ? <span className="ms-1 text-[11px] font-medium opacity-80">{sub}</span> : null}
      </p>
    </div>
  );
}
