"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as assetsApi from "@/common/api/assets";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IAsset } from "@/common/interfaces/asset.interface";
import { formatPercentShort, formatQuantity } from "@/common/utils/asset-format";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormPriceInput } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Props = {
  open: boolean;
  asset: IAsset | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

/** "قیمت امروز هر گرم چنده؟" — a tiny sheet with a live preview of the new value and profit. */
export function AssetPriceModal({ open, asset, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setPrice(asset && asset.unitPrice > 0 ? String(asset.unitPrice) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill when it opens
  }, [open, asset?._id]);

  if (!asset) return null;
  const value = Number(price);
  const unit = asset.unit;
  const newWorth = value > 0 ? Math.round(asset.quantity * value) : 0;
  const newProfit = value > 0 ? newWorth - asset.costBasis : null;
  const newPercent = newProfit != null && asset.costBasis > 0 ? (newProfit / asset.costBasis) * 100 : null;
  const changed = value > 0 && value !== asset.unitPrice;
  const money = (amount: number) => formatPriceWithCurrency(amount, currency);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!asset || !changed) return;
    setSaving(true);
    try {
      await assetsApi.updateAsset(asset._id, { unitPrice: String(value) });
      showToast(t("feat.assets.priceSaved"), "success");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} size="sm">
      <AppModalDialog>
        <form onSubmit={(e) => void submit(e)}>
          <AppModalHeader>
            <Modal.Heading>{t("feat.assets.priceQuestion", { unit })}</Modal.Heading>
            <p className="mt-0.5 truncate text-xs text-muted">{asset.title}</p>
          </AppModalHeader>
          <Modal.Body className="space-y-3">
            <FormPriceInput label={t("feat.assets.priceFieldLabel", { unit })} value={price} onChange={setPrice} currency={currency} autoFocus onFocus={(e) => e.currentTarget.select()} />

            {asset.avgBuyPrice > 0 ? (
              <button
                type="button"
                onClick={() => setPrice(String(asset.avgBuyPrice))}
                className="pb-press rounded-full border border-border/60 bg-surface-secondary px-3 py-1 text-xs font-medium hover:border-accent/40"
              >
                {t("feat.assets.useBuyPrice", { price: money(asset.avgBuyPrice) })}
              </button>
            ) : null}

            <div className="rounded-2xl bg-surface-secondary/70 p-3.5 text-sm leading-7" data-testid="price-preview" aria-live="polite">
              {value > 0 && asset.quantity > 0 ? (
                <>
                  <p>
                    {t("feat.assets.previewWorth", {
                      quantity: `${formatQuantity(asset.quantity)} ${unit}`,
                      worth: money(newWorth),
                    })}
                  </p>
                  {newProfit != null ? (
                    <p className={`font-bold ${newProfit > 0 ? "text-income" : newProfit < 0 ? "text-expense" : "text-muted"}`}>
                      {newProfit === 0
                        ? t("feat.assets.previewEven")
                        : t(newProfit > 0 ? "feat.assets.previewProfit" : "feat.assets.previewLoss", {
                            amount: money(Math.abs(newProfit)),
                          })}
                      {newPercent != null && newProfit !== 0 ? (
                        <span className="ms-1.5 text-xs font-semibold opacity-80" >
                          {formatPercentShort(newPercent)}٪
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-muted">
                  {asset.quantity > 0 ? t("feat.assets.previewEmpty") : t("feat.assets.previewNoQuantity")}
                </p>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving} isDisabled={!changed}>
              {t("feat.assets.priceSubmit")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
