"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { Edit2 } from "iconsax-reactjs";

import { assetKindMeta } from "@/common/constants/asset-kinds";
import { PATHS } from "@/common/constants";
import type { IAsset } from "@/common/interfaces/asset.interface";
import type { UserCurrency } from "@/common/constants/user-preferences";
import {
  assetProfitPercent,
  assetWorth,
  formatQuantity,
} from "@/common/utils/asset-format";
import { formatAmountOnly, formatPriceWithCurrency } from "@/common/utils/format-currency";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useTranslation } from "@/i18n";
import { ProfitChip } from "@/components/pages/assets/ProfitChip";
import { useRelativeDays } from "@/components/pages/assets/useRelativeDays";

type Props = {
  asset: IAsset;
  currency: UserCurrency;
  onBuy: (asset: IAsset) => void;
  onSell: (asset: IAsset) => void;
  onPrice: (asset: IAsset) => void;
};

/** One asset: what you hold, what it is worth, and the two things you do most (buy / sell). */
export function AssetCard({ asset, currency, onBuy, onSell, onPrice }: Props) {
  const { t } = useTranslation();
  const relative = useRelativeDays();
  const { displayCurrencyLabel } = useCurrencyLabels();
  const plain = (amount: number) => formatAmountOnly(amount, currency);
  const meta = assetKindMeta(asset.kind);
  const priced = asset.unitPrice > 0;
  const empty = asset.quantity <= 0;
  const percent = assetProfitPercent(asset);
  const money = (amount: number) => formatPriceWithCurrency(amount, currency);
  const profit = asset.profit;

  return (
    <article className="pb-box pb-lift flex flex-col" style={{ ["--tone" as string]: meta.color }} data-testid="asset-card">
      <Link href={PATHS.ASSET(asset._id)} className="absolute inset-0 z-0 rounded-3xl" aria-label={asset.title} />

      <div className="pointer-events-none relative z-[1] flex items-start gap-3">
        <span className="pb-box-icon">
          <meta.icon size={24} variant="Bulk" color={meta.color} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words font-bold leading-6" title={asset.title}>
            {asset.title}
          </h3>
          <p className="text-xs text-muted">
            {empty
              ? t("feat.assets.soldOutShort")
              : `${formatQuantity(asset.quantity)} ${asset.unit}`}
            <span aria-hidden> · </span>
            {t(`feat.assets.kind.${asset.kind}`)}
          </p>
        </div>
      </div>

      <div className="pointer-events-none relative z-[1] mt-4">
        {empty ? (
          <p className="text-lg font-extrabold text-muted">{t("feat.assets.soldOut")}</p>
        ) : (
          <>
            <p className="break-words text-2xl font-extrabold tracking-tight">{money(assetWorth(asset))}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {profit != null ? (
                <ProfitChip profit={profit} percent={percent} money={money} />
              ) : (
                <span className="inline-flex items-center rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning-foreground">
                  {t("feat.assets.atBuyPrice")}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="relative z-[2] mt-3 flex items-start justify-between gap-2 text-xs leading-6 text-muted">
        <p className="min-w-0">
          {asset.avgBuyPrice > 0 ? (
            <>
              {t("feat.assets.avgLine", { price: priced ? plain(asset.avgBuyPrice) : money(asset.avgBuyPrice) })}
              <span aria-hidden> · </span>
            </>
          ) : null}
          {priced ? (
            <>
              {t("feat.assets.todayLine", { price: plain(asset.unitPrice) })}
              <span className="whitespace-nowrap"> {displayCurrencyLabel(currency)}</span>
              {asset.priceUpdatedAt ? <span className="whitespace-nowrap"> ({relative(asset.priceUpdatedAt)})</span> : null}
            </>
          ) : (
            <button type="button" onClick={() => onPrice(asset)} className="font-semibold text-accent hover:underline">
              {t("feat.assets.enterPrice")}
            </button>
          )}
        </p>
        <button
          type="button"
          className="pb-icon-btn -my-1.5 !size-8 text-accent"
          aria-label={t("feat.assets.editPriceAria", { unit: asset.unit })}
          onClick={() => onPrice(asset)}
       >
          <Edit2 size={15} />
        </button>
      </div>

      <div className="relative z-[2] mt-auto grid grid-cols-2 gap-2 pt-4">
        <Button size="sm" className="pb-press w-full" onPress={() => onBuy(asset)}>
          {t("feat.assets.buy")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="pb-press w-full"
          isDisabled={empty}
          aria-label={empty ? t("feat.assets.sellDisabledHint") : undefined}
          onPress={() => onSell(asset)}
       >
          {t("feat.assets.sell")}
        </Button>
      </div>
      {empty ? (
        <p className="relative z-[1] mt-1.5 text-center text-[11px] text-muted">{t("feat.assets.sellDisabledHint")}</p>
      ) : null}
    </article>
  );
}
