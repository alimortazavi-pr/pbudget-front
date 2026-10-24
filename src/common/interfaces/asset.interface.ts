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
  /** Average price paid for one unit. */
  avgBuyPrice: number;
  costBasis: number;
  /** False while units without a purchase price (gifts) are held. */
  costKnown?: boolean;
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
  /** False for a buy without a price (a gift). */
  priceKnown?: boolean;
  /** Created from an expense marked as an investment. */
  fromTransaction?: boolean;
  year: string | number;
  month: string | number;
  day: string | number;
  note?: string;
  budget?: string | null;
}
