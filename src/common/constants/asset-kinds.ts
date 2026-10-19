import {
  Bitcoin,
  Building,
  Chart2,
  Coin1,
  DollarCircle,
  Layer,
  Medal,
  MedalStar,
} from "iconsax-reactjs";
import type { ComponentType } from "react";

import type { AssetKind } from "@/common/interfaces/asset.interface";

type KindIcon = ComponentType<{
  size?: number | string;
  variant?: "Linear" | "Bold" | "Outline" | "Broken" | "TwoTone" | "Bulk";
  color?: string;
}>;

export const ASSET_KIND_META: Record<AssetKind, { color: string; icon: KindIcon }> = {
  gold: { color: "#f59e0b", icon: Medal },
  coin: { color: "#eab308", icon: Coin1 },
  silver: { color: "#94a3b8", icon: MedalStar },
  currency: { color: "#22c55e", icon: DollarCircle },
  crypto: { color: "#f97316", icon: Bitcoin },
  stock: { color: "#3b82f6", icon: Chart2 },
  property: { color: "#8b5cf6", icon: Building },
  other: { color: "#64748b", icon: Layer },
};

export function assetKindMeta(kind: string) {
  return ASSET_KIND_META[kind as AssetKind] ?? ASSET_KIND_META.other;
}
