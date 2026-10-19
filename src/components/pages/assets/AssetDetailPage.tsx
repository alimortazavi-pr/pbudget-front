"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dropdown, Label, Modal } from "@heroui/react";
import { Edit2, More, Trash } from "iconsax-reactjs";

import * as assetsApi from "@/common/api/assets";
import { assetKindMeta } from "@/common/constants/asset-kinds";
import { PATHS } from "@/common/constants";
import {
  DEFAULT_USER_PREFERENCES,
  resolveBudgetDateCalendar,
} from "@/common/constants/user-preferences";
import type { IAssetTrade } from "@/common/interfaces/asset.interface";
import { formatBudgetDate } from "@/common/utils";
import {
  assetProfitPercent,
  assetWorth,
  formatQuantity,
} from "@/common/utils/asset-format";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { AssetEditModal } from "@/components/pages/assets/AssetEditModal";
import { AssetPriceModal } from "@/components/pages/assets/AssetPriceModal";
import { AssetTradeModal } from "@/components/pages/assets/AssetTradeModal";
import { ProfitChip } from "@/components/pages/assets/ProfitChip";
import { useAssets } from "@/components/pages/assets/useAssets";
import { useRelativeDays } from "@/components/pages/assets/useRelativeDays";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Sheet = "buy" | "sell" | "price" | "edit" | "remove-asset" | null;

/** One asset in plain words: a summary sentence, the three things you do with it, then its history. */
export function AssetDetailPage({ assetId }: { assetId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const relative = useRelativeDays();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);
  const { assets, loading, reload, refreshWallet } = useAssets();
  const asset = useMemo(() => assets.find((item) => item._id === assetId) ?? null, [assets, assetId]);

  const [trades, setTrades] = useState<IAssetTrade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [removingTrade, setRemovingTrade] = useState<IAssetTrade | null>(null);
  const [busy, setBusy] = useState(false);

  const loadTrades = useCallback(async () => {
    try {
      setTrades(await assetsApi.fetchAssetTrades(assetId));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setTradesLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    void loadTrades();
  }, [loadTrades]);

  const money = (amount: number) => formatPriceWithCurrency(amount, currency);

  async function afterChange() {
    await Promise.all([reload(), loadTrades()]);
    await refreshWallet();
  }

  async function removeTrade(keepTransaction: boolean) {
    if (!removingTrade) return;
    setBusy(true);
    try {
      await assetsApi.deleteAssetTrade(assetId, removingTrade._id, keepTransaction);
      showToast(t("common.deleted"), "success");
      setRemovingTrade(null);
      await afterChange();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function removeAsset() {
    if (!asset) return;
    setBusy(true);
    try {
      await assetsApi.softDeleteAsset(asset._id);
      showToast(t("common.deleted"), "success");
      router.replace(PATHS.ASSETS);
    } catch (error) {
      showErrorToast(error);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="pb-shimmer h-52 rounded-3xl" />
        <div className="pb-shimmer h-40 rounded-3xl" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="pb-pop mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-bold">{t("feat.assets.notFound")}</p>
        <Link href={PATHS.ASSETS} className="mt-4 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground">
          {t("feat.assets.backToList")}
        </Link>
      </div>
    );
  }

  const meta = assetKindMeta(asset.kind);
  const priced = asset.unitPrice > 0;
  const empty = asset.quantity <= 0;
  const percent = assetProfitPercent(asset);
  const profit = asset.profit;
  const sold = trades.some((trade) => trade.side === "sell");
  const profitWord = profit == null ? "" : profit > 0 ? t("feat.assets.profitWord") : t("feat.assets.lossWord");

  let sentence: string;
  if (asset.tradeCount === 0) sentence = t("feat.assets.sentenceNoTrades");
  else if (empty) sentence = t("feat.assets.sentenceSoldOut");
  else if (!priced)
    sentence = t("feat.assets.sentenceNoPrice", {
      quantity: `${formatQuantity(asset.quantity)} ${asset.unit}`,
      title: asset.title,
      cost: money(asset.costBasis),
    });
  else if (profit === 0)
    sentence = t("feat.assets.sentenceEven", {
      quantity: `${formatQuantity(asset.quantity)} ${asset.unit}`,
      title: asset.title,
      cost: money(asset.costBasis),
      worth: money(asset.value),
    });
  else
    sentence = t("feat.assets.sentence", {
      quantity: `${formatQuantity(asset.quantity)} ${asset.unit}`,
      title: asset.title,
      cost: money(asset.costBasis),
      worth: money(asset.value),
      profit: money(Math.abs(profit ?? 0)),
      word: profitWord,
    });

  return (
    <div className="space-y-5">
      <section className="pb-box" style={{ ["--tone" as string]: meta.color }} data-testid="asset-summary">
        <div className="relative z-[1] flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="pb-box-icon">
              <meta.icon size={24} variant="Bulk" color={meta.color} />
            </span>
            <div className="min-w-0">
              <h1 className="break-words text-lg font-extrabold leading-7">{asset.title}</h1>
              <p className="text-xs text-muted">{t(`feat.assets.kind.${asset.kind}`)}</p>
            </div>
          </div>
          <Dropdown>
            <Dropdown.Trigger className="pb-icon-btn" aria-label={t("feat.assets.menuAria")}>
              <More size={20} />
            </Dropdown.Trigger>
            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label={t("feat.assets.menuAria")}
                onAction={(key) => setSheet(key === "edit" ? "edit" : "remove-asset")}
              >
                <Dropdown.Item id="edit" textValue={t("common.edit")}>
                  <Edit2 size={16} />
                  <Label>{t("common.edit")}</Label>
                </Dropdown.Item>
                <Dropdown.Item id="remove" textValue={t("feat.assets.remove")} variant="danger">
                  <Trash size={16} />
                  <Label>{t("feat.assets.remove")}</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>

        <p className="relative z-[1] mt-4 text-[15px] leading-8" data-testid="asset-sentence">
          {sentence}
        </p>

        {asset.tradeCount > 0 && !empty ? (
          <div className="relative z-[1] mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold">
              {t("feat.assets.worthChip", { amount: money(assetWorth(asset)) })}
            </span>
            {profit != null && profit !== 0 ? <ProfitChip profit={profit} percent={percent} money={money} /> : null}
          </div>
        ) : null}

        {sold ? (
          <p className="relative z-[1] mt-3 text-xs leading-6 text-muted" data-testid="asset-realized">
            {t(asset.realizedProfit >= 0 ? "feat.assets.realizedLine" : "feat.assets.realizedLossLine", { amount: money(Math.abs(asset.realizedProfit)) })}
          </p>
        ) : null}

        <div className="relative z-[1] mt-3 flex flex-wrap items-center gap-x-1.5 border-t border-border/40 pt-3 text-xs leading-6 text-muted">
          {asset.avgBuyPrice > 0 ? <span>{t("feat.assets.avgLine", { price: money(asset.avgBuyPrice) })}</span> : null}
          {asset.avgBuyPrice > 0 ? <span aria-hidden>·</span> : null}
          {priced ? (
            <span>
              {t("feat.assets.todayLine", { price: money(asset.unitPrice) })}
              {asset.priceUpdatedAt ? ` (${relative(asset.priceUpdatedAt)})` : ""}
            </span>
          ) : (
            <span>{t("feat.assets.noPriceYet")}</span>
          )}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2" data-testid="asset-actions">
        <Button className="pb-press w-full" onPress={() => setSheet("buy")}>
          {t("feat.assets.buy")}
        </Button>
        <Button
          variant="secondary"
          className="pb-press w-full"
          isDisabled={empty}
          aria-label={empty ? t("feat.assets.sellDisabledHint") : undefined}
          onPress={() => setSheet("sell")}
        >
          {t("feat.assets.sell")}
        </Button>
        <Button variant="secondary" className="pb-press w-full" onPress={() => setSheet("price")}>
          {t("feat.assets.todayPrice")}
        </Button>
      </div>
      {empty && asset.tradeCount > 0 ? (
        <p className="-mt-3 text-center text-[11px] text-muted">{t("feat.assets.sellDisabledHint")}</p>
      ) : null}

      <section className="space-y-3">
        <h2 className="px-1 text-base font-extrabold">{t("feat.assets.history")}</h2>
        {tradesLoading ? (
          <div className="pb-shimmer h-24 rounded-2xl" aria-hidden />
        ) : trades.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted">
            {t("feat.assets.noTrades")}
          </p>
        ) : (
          <ol className="relative space-y-3 ps-6 before:absolute before:inset-y-2 before:start-[7px] before:w-px before:bg-border/70" data-testid="asset-history">
            {trades.map((trade) => {
              const buy = trade.side === "buy";
              const perUnit = trade.quantity > 0 ? trade.totalPrice / trade.quantity : 0;
              return (
                <li key={trade._id} className="relative">
                  <span
                    aria-hidden
                    className={`absolute -start-6 top-4 size-[15px] rounded-full border-[3px] border-background ${buy ? "bg-[var(--brand-teal)]" : "bg-[var(--brand-rose)]"}`}
                  />
                  <div className="glass rounded-2xl p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-bold">
                          <span className={buy ? "text-income" : "text-expense"}>
                            {buy ? t("feat.assets.buy") : t("feat.assets.sell")}
                          </span>
                          <span>
                            {formatQuantity(trade.quantity)} {asset.unit}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {formatBudgetDate(String(trade.year), String(trade.month), String(trade.day), calendar)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <p className="text-sm font-extrabold">{money(trade.totalPrice)}</p>
                        <button
                          type="button"
                          className="pb-icon-btn hover:!text-danger"
                          aria-label={t("common.delete")}
                          onClick={() => setRemovingTrade(trade)}
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      {perUnit > 0 ? <span>{t("feat.assets.perUnitShort", { unit: asset.unit, price: money(perUnit) })}</span> : null}
                      {trade.budget ? (
                        <Link
                          href={PATHS.BUDGET(trade.budget)}
                          className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent hover:underline"
                        >
                          {t("feat.assets.inTransactions")}
                        </Link>
                      ) : null}
                      {trade.note ? <span className="break-words">{trade.note}</span> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <AssetTradeModal
        open={sheet === "buy" || sheet === "sell"}
        asset={asset}
        side={sheet === "sell" ? "sell" : "buy"}
        onOpenChange={(open) => !open && setSheet(null)}
        onSaved={() => void afterChange()}
      />
      <AssetPriceModal
        open={sheet === "price"}
        asset={asset}
        onOpenChange={(open) => !open && setSheet(null)}
        onSaved={() => void reload()}
      />
      <AssetEditModal
        open={sheet === "edit"}
        asset={asset}
        onOpenChange={(open) => !open && setSheet(null)}
        onSaved={() => void reload()}
      />

      <AppModal open={sheet === "remove-asset"} onOpenChange={(open) => !open && setSheet(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader>
            <Modal.Heading>{t("feat.assets.removeTitle", { title: asset.title })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">{t("feat.assets.removeBody")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setSheet(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={busy} onPress={() => void removeAsset()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>

      <AppModal open={Boolean(removingTrade)} onOpenChange={(open) => !open && setRemovingTrade(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader>
            <Modal.Heading>{t("feat.assets.removeTradeTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">
              {removingTrade?.budget ? t("feat.assets.removeTradeLinked") : t("feat.assets.removeTradePlain")}
            </p>
          </Modal.Body>
          <Modal.Footer className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" isDisabled={busy} onPress={() => setRemovingTrade(null)}>
              {t("common.cancel")}
            </Button>
            {removingTrade?.budget ? (
              <Button variant="secondary" isDisabled={busy} onPress={() => void removeTrade(true)}>
                {t("feat.assets.removeTradeOnly")}
              </Button>
            ) : null}
            <Button variant="danger" isPending={busy} onPress={() => void removeTrade(false)}>
              {removingTrade?.budget ? t("feat.assets.removeTradeAndTx") : t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
