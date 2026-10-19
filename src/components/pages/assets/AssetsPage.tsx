"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, Coin1 } from "iconsax-reactjs";

import * as assetsApi from "@/common/api/assets";
import { assetKindMeta } from "@/common/constants/asset-kinds";
import { PATHS } from "@/common/constants";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IAsset, IAssetTotals, IAssetTrade } from "@/common/interfaces/asset.interface";
import { formatPercent, formatQuantity } from "@/common/utils/asset-format";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { AssetDetailModal } from "@/components/pages/assets/AssetDetailModal";
import { AssetFormModal } from "@/components/pages/assets/AssetFormModal";
import { AssetTradeModal } from "@/components/pages/assets/AssetTradeModal";
import { useTranslation } from "@/i18n";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { userSelector } from "@/stores/profile";

type Layer =
  | { kind: "detail" }
  | { kind: "form"; asset: IAsset | null }
  | { kind: "trade"; side: "buy" | "sell" }
  | { kind: "remove-asset" }
  | { kind: "remove-trade"; trade: IAssetTrade }
  | null;

export function AssetsPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [totals, setTotals] = useState<IAssetTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [layer, setLayer] = useState<Layer>(null);
  const [tradesKey, setTradesKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const selected = useMemo(() => assets.find((item) => item._id === selectedId) ?? null, [assets, selectedId]);

  const load = useCallback(async () => {
    try {
      const data = await assetsApi.fetchAssets();
      setAssets(data.assets);
      setTotals(data.totals);
      setDisabled(false);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) setDisabled(true);
      else showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // If the module is switched off in settings in another tab, the 403 above explains it.
  const totalProfit = useMemo(
    () => assets.reduce((sum, item) => sum + (item.profit ?? 0), 0),
    [assets],
  );
  const pricedCost = useMemo(
    () => assets.reduce((sum, item) => sum + (item.profit == null ? 0 : item.costBasis), 0),
    [assets],
  );

  function openDetail(asset: IAsset) {
    setSelectedId(asset._id);
    setLayer({ kind: "detail" });
  }

  async function afterTrade() {
    setTradesKey((n) => n + 1);
    await load();
    // A recorded transaction changes the wallet and the transaction list.
    dispatch(bumpBudgetRevision());
    setLayer({ kind: "detail" });
  }

  async function removeAsset() {
    if (!selected) return;
    setBusy(true);
    try {
      await assetsApi.softDeleteAsset(selected._id);
      showToast(t("common.deleted"), "success");
      setLayer(null);
      setSelectedId("");
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function removeTrade(trade: IAssetTrade) {
    if (!selected) return;
    setBusy(true);
    try {
      await assetsApi.deleteAssetTrade(selected._id, trade._id);
      showToast(t("common.deleted"), "success");
      setTradesKey((n) => n + 1);
      await load();
      setLayer({ kind: "detail" });
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  if (disabled) {
    return (
      <div className="pb-pop mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <Coin1 size={30} variant="Bulk" />
        </span>
        <p className="font-bold">{t("feat.assets.disabledTitle")}</p>
        <p className="mt-1 text-sm leading-7 text-muted">{t("feat.assets.disabledBody")}</p>
        <Link href={PATHS.SETTINGS} className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground">
          {t("feat.assets.goToSettings")}
        </Link>
      </div>
    );
  }

  const profitTone = totalProfit >= 0 ? "text-emerald-100" : "text-rose-100";

  return (
    <div className="space-y-5">
      <PageHeroSection
        variant="amber"
        eyebrow={t("feat.assets.eyebrow")}
        title={t("nav.assets")}
        description={t("feat.assets.subtitle")}
        aside={
          <Button className="bg-white/95 font-semibold text-amber-700" onPress={() => setLayer({ kind: "form", asset: null })}>
            <Add size={18} />
            {t("feat.assets.add")}
          </Button>
        }
        footer={
          assets.length && totals ? (
            <div className="mt-5 grid grid-cols-2 gap-2 text-white sm:grid-cols-3" data-testid="assets-summary">
              <div className="col-span-2 rounded-2xl bg-white/12 px-3 py-2.5 sm:col-span-1">
                <p className="text-[11px] text-white/75">{t("feat.assets.totalValue")}</p>
                <p className="mt-0.5 break-words text-base font-extrabold lg:text-xl">
                  {formatPriceWithCurrency(totals.value, currency)}
                </p>
                {totals.unpriced > 0 ? (
                  <p className="mt-0.5 text-[11px] text-white/75">
                    {t("feat.assets.unpricedNote", { count: toPersianDigits(totals.unpriced) })}
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl bg-white/12 px-3 py-2.5">
                <p className="text-[11px] text-white/75">{t("feat.assets.totalCost")}</p>
                <p className="mt-0.5 break-words text-base font-extrabold lg:text-xl">
                  {formatPriceWithCurrency(totals.costBasis, currency)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/12 px-3 py-2.5">
                <p className="text-[11px] text-white/75">{t("feat.assets.profitLoss")}</p>
                <p className={`mt-0.5 break-words text-base font-extrabold lg:text-xl ${profitTone}`}>
                  {totalProfit > 0 ? "+" : totalProfit < 0 ? "−" : ""}
                  {formatPriceWithCurrency(Math.abs(totalProfit), currency)}
                </p>
                {pricedCost > 0 ? (
                  <p className={`mt-0.5 text-[11px] ${profitTone}`}>
                    {formatPercent((totalProfit / pricedCost) * 100)}٪
                  </p>
                ) : null}
                {totals.realizedProfit !== 0 ? (
                  <p className="mt-0.5 text-[11px] text-white/75">
                    {t("feat.assets.realized", {
                      amount: `${totals.realizedProfit > 0 ? "+" : "−"}${formatPriceWithCurrency(Math.abs(totals.realizedProfit), currency)}`,
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pb-shimmer h-36 rounded-3xl" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="pb-pop flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Coin1 size={30} variant="Bulk" />
          </span>
          <p className="font-bold">{t("feat.assets.emptyTitle")}</p>
          <p className="mt-1 max-w-sm text-sm leading-7 text-muted">{t("feat.assets.emptyHint")}</p>
          <Button className="mt-5" onPress={() => setLayer({ kind: "form", asset: null })}>
            <Add size={18} />
            {t("feat.assets.add")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="assets-list">
          {assets.map((asset) => {
            const meta = assetKindMeta(asset.kind);
            const percent = asset.profit != null && asset.costBasis > 0 ? (asset.profit / asset.costBasis) * 100 : null;
            return (
              <button
                key={asset._id}
                type="button"
                onClick={() => openDetail(asset)}
                className="glass pb-lift cursor-pointer rounded-2xl p-4 text-start"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${meta.color}22` }}>
                    <meta.icon size={24} variant="Bulk" color={meta.color} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-bold">{asset.title}</h3>
                    <p className="text-xs text-muted">
                      {formatQuantity(asset.quantity)} {asset.unit} · {t(`feat.assets.kind.${asset.kind}`)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted">{t("feat.assets.value")}</p>
                    <p className="break-words text-lg font-extrabold">
                      {asset.unitPrice > 0 ? formatPriceWithCurrency(asset.value, currency) : "—"}
                    </p>
                  </div>
                  {asset.profit == null ? (
                    <span className="shrink-0 rounded-full bg-warning/20 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground">
                      {t("feat.assets.noPriceBadge")}
                    </span>
                  ) : (
                    <span className={`shrink-0 text-sm font-bold ${asset.profit >= 0 ? "text-success" : "text-danger"}`}>
                      {asset.profit > 0 ? "+" : asset.profit < 0 ? "−" : ""}
                      {formatPriceWithCurrency(Math.abs(asset.profit), currency)}
                      {percent != null ? (
                        <span className="ms-1 text-[11px] font-medium opacity-80">{formatPercent(percent)}٪</span>
                      ) : null}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <AssetDetailModal
        open={layer?.kind === "detail" && Boolean(selected)}
        asset={selected}
        refreshKey={tradesKey}
        onOpenChange={(open) => !open && layer?.kind === "detail" && setLayer(null)}
        onTrade={(side) => setLayer({ kind: "trade", side })}
        onEdit={() => setLayer({ kind: "form", asset: selected })}
        onRemove={() => setLayer({ kind: "remove-asset" })}
        onRemoveTrade={(trade) => setLayer({ kind: "remove-trade", trade })}
        onPriceSaved={() => void load()}
      />

      <AssetFormModal
        open={layer?.kind === "form"}
        asset={layer?.kind === "form" ? layer.asset : null}
        onOpenChange={(open) => {
          // AppModal also reports programmatic closes; only a real close of this dialog counts.
          if (open || layer?.kind !== "form") return;
          // Editing returns to the detail view; creating just closes.
          setLayer(layer?.kind === "form" && layer.asset ? { kind: "detail" } : null);
        }}
        onSaved={() => void load()}
      />

      <AssetTradeModal
        open={layer?.kind === "trade"}
        asset={selected}
        side={layer?.kind === "trade" ? layer.side : "buy"}
        onOpenChange={(open) => !open && layer?.kind === "trade" && setLayer({ kind: "detail" })}
        onSaved={() => void afterTrade()}
      />

      <AppModal
        open={layer?.kind === "remove-asset"}
        onOpenChange={(open) => !open && layer?.kind === "remove-asset" && setLayer({ kind: "detail" })}
        size="sm"
      >
        <AppModalDialog>
          <AppModalHeader onClose={() => setLayer({ kind: "detail" })}>
            <Modal.Heading>{t("common.deleteConfirm", { name: selected?.title ?? "" })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">{t("feat.assets.removeBody")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setLayer({ kind: "detail" })}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={busy} onPress={() => void removeAsset()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>

      <AppModal
        open={layer?.kind === "remove-trade"}
        onOpenChange={(open) => !open && layer?.kind === "remove-trade" && setLayer({ kind: "detail" })}
        size="sm"
      >
        <AppModalDialog>
          <AppModalHeader onClose={() => setLayer({ kind: "detail" })}>
            <Modal.Heading>{t("feat.assets.removeTradeTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">{t("feat.assets.removeTradeBody")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setLayer({ kind: "detail" })}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              isPending={busy}
              onPress={() => layer?.kind === "remove-trade" && void removeTrade(layer.trade)}
            >
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
