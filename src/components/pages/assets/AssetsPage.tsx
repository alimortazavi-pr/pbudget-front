"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Add, ArrowDown, ArrowUp } from "iconsax-reactjs";

import { ASSET_KIND_META, ASSET_KIND_TILE_ORDER } from "@/common/constants/asset-kinds";
import { PATHS } from "@/common/constants";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { AssetKind, IAsset } from "@/common/interfaces/asset.interface";
import {
  assetWorth,
  formatPercentShort,
  summarizeAssets,
} from "@/common/utils/asset-format";
import { formatAmountOnly, formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";
import { OverflowReveal } from "@/components/common/ui/OverflowReveal";
import { AssetAddModal } from "@/components/pages/assets/AssetAddModal";
import { AssetCard } from "@/components/pages/assets/AssetCard";
import { AssetPriceModal } from "@/components/pages/assets/AssetPriceModal";
import { AssetTradeModal } from "@/components/pages/assets/AssetTradeModal";
import { useAssets } from "@/components/pages/assets/useAssets";
import { useTranslation } from "@/i18n";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export function AssetsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { displayCurrencyLabel } = useCurrencyLabels();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const unitLabel = displayCurrencyLabel(currency);
  const { assets, loading, reload, refreshWallet } = useAssets();

  const [addKind, setAddKind] = useState<AssetKind | null | undefined>(undefined);
  // The dialogs keep their last asset while they animate out, so open/close is a separate flag.
  const [trade, setTrade] = useState<{ asset: IAsset; side: "buy" | "sell" } | null>(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [priceFor, setPriceFor] = useState<IAsset | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);

  const summary = useMemo(() => summarizeAssets(assets), [assets]);
  const sorted = useMemo(
    () => [...assets].sort((a, b) => assetWorth(b) - assetWorth(a)),
    [assets],
  );
  const money = (amount: number) => formatPriceWithCurrency(amount, currency);
  const worthText = formatAmountOnly(summary.worth, currency);

  async function afterTrade() {
    await reload();
    await refreshWallet();
  }

  const hasAssets = assets.length > 0;
  const profitTone = summary.profit > 0 ? "up" : summary.profit < 0 ? "down" : undefined;

  return (
    <div className="space-y-5">
      <PageHeroSection
        variant="amber"
        eyebrow={t("feat.assets.eyebrow")}
        title={t("nav.assets")}
        description={hasAssets ? undefined : t("feat.assets.subtitle")}
        aside={
          <Button
            className="bg-white/95 font-semibold text-amber-700"
            data-testid="asset-add"
            onPress={() => setAddKind(null)}
          >
            <Add size={18} />
            {t("feat.assets.add")}
          </Button>
        }
        footer={
          hasAssets ? (
            <div className="mt-5" data-testid="assets-summary">
              <p className="text-xs font-medium text-white/80">{t("feat.assets.heroLabel")}</p>
              <div className="mt-1 flex min-w-0 items-end gap-2">
                <OverflowReveal full={`${worthText} ${unitLabel}`} className="min-w-0 truncate">
                  <span className={`pb-balance-amount text-white ${worthText.length > 13 ? "pb-balance-sm" : ""}`}>
                    <AnimatedNumber value={summary.worth} format={(n) => formatAmountOnly(n, currency)} />
                  </span>
                </OverflowReveal>
                <span className="mb-1.5 shrink-0 text-sm font-semibold text-white/80">{unitLabel}</span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {summary.hasPrice ? (
                  <span className="pb-wallet-chip" data-tone={profitTone} data-testid="assets-profit">
                    {summary.profit >= 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                    {summary.profit > 0
                      ? t("feat.assets.heroProfit")
                      : summary.profit < 0
                        ? t("feat.assets.heroLoss")
                        : t("feat.assets.heroEven")}
                    {summary.profit !== 0 ? (
                      <span>
                        {money(Math.abs(summary.profit))}
                        {summary.profitPercent != null ? ` (${formatPercentShort(summary.profitPercent)}٪)` : ""}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span className="pb-wallet-chip" data-testid="assets-profit">
                    {t("feat.assets.heroNoPrice")}
                  </span>
                )}
                {summary.realized !== 0 ? (
                  <span className="pb-wallet-chip">
                    {t(summary.realized > 0 ? "feat.assets.heroRealized" : "feat.assets.heroRealizedLoss", { amount: money(Math.abs(summary.realized)) })}
                  </span>
                ) : null}
              </div>

              {summary.byKind.length > 0 ? (
                <div className="mt-4">
                  <div
                    className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/20"
                    role="img"
                    aria-label={t("feat.assets.allocationAria")}
                  >
                    {summary.byKind.map((part) => (
                      <span
                        key={part.kind}
                        className="pb-bar-x h-full first:rounded-s-full last:rounded-e-full"
                        style={{ width: `${Math.max(part.share, 2)}%`, background: ASSET_KIND_META[part.kind].color }}
                      />
                    ))}
                  </div>
                  <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-white/85">
                    {summary.byKind.map((part) => (
                      <li key={part.kind} className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full ring-1 ring-white/50" style={{ background: ASSET_KIND_META[part.kind].color }} />
                        {t(`feat.assets.kind.${part.kind}`)}
                        <span className="font-bold text-white">{toPersianDigits(Math.round(part.share))}٪</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {summary.unpriced > 0 ? (
                <p className="mt-3.5 rounded-xl bg-white/12 px-3 py-2 text-xs leading-6 text-white/90" data-testid="assets-unpriced">
                  {t("feat.assets.heroUnpriced", { count: summary.unpriced })}
                </p>
              ) : null}
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pb-shimmer h-56 rounded-3xl" />
          ))}
        </div>
      ) : !hasAssets ? (
        <section className="pb-pop rounded-3xl border border-dashed border-border px-5 py-8 text-center" data-testid="assets-empty">
          <p className="text-lg font-extrabold">{t("feat.assets.emptyTitle")}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-7 text-muted">{t("feat.assets.emptyHint")}</p>
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-2.5 text-start sm:grid-cols-4">
            {ASSET_KIND_TILE_ORDER.map((kind) => {
              const meta = ASSET_KIND_META[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setAddKind(kind)}
                  className="pb-press flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border/60 bg-surface p-3.5 text-center transition-colors hover:border-accent/50"
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${meta.color}22` }}>
                    <meta.icon size={26} variant="Bulk" color={meta.color} />
                  </span>
                  <span className="text-sm font-bold">{t(`feat.assets.kind.${kind}`)}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <div className="pb-card-grid !gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="assets-list">
          {sorted.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              currency={currency}
              onBuy={(item) => {
                setTrade({ asset: item, side: "buy" });
                setTradeOpen(true);
              }}
              onSell={(item) => {
                setTrade({ asset: item, side: "sell" });
                setTradeOpen(true);
              }}
              onPrice={(item) => {
                setPriceFor(item);
                setPriceOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <AssetAddModal
        open={addKind !== undefined}
        initialKind={addKind ?? null}
        onOpenChange={(open) => !open && setAddKind(undefined)}
        onCreated={(asset) => {
          void afterTrade();
          router.prefetch(PATHS.ASSET(asset._id));
        }}
      />
      <AssetTradeModal
        open={tradeOpen}
        asset={trade ? (assets.find((item) => item._id === trade.asset._id) ?? trade.asset) : null}
        side={trade?.side ?? "buy"}
        onOpenChange={setTradeOpen}
        onSaved={() => void afterTrade()}
      />
      <AssetPriceModal
        open={priceOpen}
        asset={priceFor ? (assets.find((item) => item._id === priceFor._id) ?? priceFor) : null}
        onOpenChange={setPriceOpen}
        onSaved={() => void reload()}
      />
    </div>
  );
}
