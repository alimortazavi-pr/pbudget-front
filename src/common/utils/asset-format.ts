import type { AssetKind, IAsset } from "@/common/interfaces/asset.interface";
import { toEnglishDigits, toPersianDigits } from "@/common/utils/persian-digits";

/** "2.5" -> "۲٫۵" (up to 6 decimals, thousands separated). */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value)) return toPersianDigits("0");
  return toPersianDigits(value.toLocaleString("en-US", { maximumFractionDigits: 6 })).replace(/\./g, "٫");
}

/** Keeps only digits and one decimal point while typing (Persian digits accepted). */
export function sanitizeQuantityInput(raw: string): string {
  const english = toEnglishDigits(raw).replace(/[٫,،]/g, ".");
  const cleaned = english.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 6)}` : whole;
}

export function formatPercent(value: number): string {
  return toPersianDigits(Math.abs(value).toFixed(1)).replace(/\./g, "٫");
}

/** "20" for whole numbers, "3٫5" below 10%: short enough for a chip. */
export function formatPercentShort(value: number): string {
  const abs = Math.abs(value);
  if (!Number.isFinite(abs)) return toPersianDigits("0");
  const text = abs >= 10 ? String(Math.round(abs)) : abs.toFixed(1).replace(/\.0$/, "");
  return toPersianDigits(text).replace(/\./g, "٫");
}

/** What an asset is worth for totals: today's price, or what it cost while there is no price yet. */
export function assetWorth(asset: Pick<IAsset, "unitPrice" | "value" | "costBasis">): number {
  return asset.unitPrice > 0 ? asset.value : asset.costBasis;
}

export type AssetsSummary = {
  worth: number;
  /** Profit of the priced assets only. */
  profit: number;
  /** Profit as a share of what the priced assets cost (null while nothing has a price). */
  profitPercent: number | null;
  hasPrice: boolean;
  unpriced: number;
  realized: number;
  byKind: { kind: AssetKind; worth: number; share: number }[];
};

export function summarizeAssets(assets: IAsset[]): AssetsSummary {
  let worth = 0;
  let profit = 0;
  let pricedCost = 0;
  let unpriced = 0;
  let realized = 0;
  const kinds = new Map<AssetKind, number>();
  for (const asset of assets) {
    const own = assetWorth(asset);
    worth += own;
    realized += asset.realizedProfit;
    if (asset.profit == null) {
      if (asset.quantity > 0 && asset.unitPrice <= 0) unpriced += 1;
    } else {
      profit += asset.profit;
      pricedCost += asset.costBasis;
    }
    if (own > 0) kinds.set(asset.kind, (kinds.get(asset.kind) ?? 0) + own);
  }
  const byKind = [...kinds.entries()]
    .map(([kind, amount]) => ({ kind, worth: amount, share: worth > 0 ? (amount / worth) * 100 : 0 }))
    .sort((a, b) => b.worth - a.worth);
  return {
    worth,
    profit,
    profitPercent: pricedCost > 0 ? (profit / pricedCost) * 100 : null,
    hasPrice: assets.some((asset) => asset.profit != null),
    unpriced,
    realized,
    byKind,
  };
}

/** Profit of one asset as a percentage of its cost (null when there is no price or no cost). */
export function assetProfitPercent(asset: Pick<IAsset, "profit" | "costBasis">): number | null {
  if (asset.profit == null || asset.costBasis <= 0) return null;
  return (asset.profit / asset.costBasis) * 100;
}
