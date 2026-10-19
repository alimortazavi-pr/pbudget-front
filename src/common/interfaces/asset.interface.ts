export const ASSET_KINDS = [
  "gold",
  "coin",
  "silver",
  "currency",
  "crypto",
  "stock",
  "property",
  "other",
] as const;

export type AssetKind = (typeof ASSET_KINDS)[number];

export interface IAsset {
  _id: string;
  title: string;
  kind: AssetKind;
  unit: string;
  unitPrice: number;
  priceUpdatedAt?: string | null;
  note?: string;
  quantity: number;
  costBasis: number;
  value: number;
  /** null while the asset has no price yet. */
  profit: number | null;
  realizedProfit: number;
  tradeCount: number;
}

export interface IAssetTotals {
  costBasis: number;
  value: number;
  unpriced: number;
  realizedProfit: number;
}

export interface IAssetTrade {
  _id: string;
  side: "buy" | "sell";
  quantity: number;
  totalPrice: number;
  year: string | number;
  month: string | number;
  day: string | number;
  note?: string;
  budget?: string | null;
}
