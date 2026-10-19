import { axiosInstance } from "@/common/axiosInstance";
import type {
  AssetKind,
  IAsset,
  IAssetTotals,
  IAssetTrade,
} from "@/common/interfaces/asset.interface";

export async function fetchAssets() {
  const { data } = await axiosInstance.get<{ assets: IAsset[]; totals: IAssetTotals }>("/assets");
  return data;
}

export async function createAsset(payload: {
  title: string;
  kind: AssetKind;
  unit?: string;
  unitPrice?: string;
  note?: string;
}) {
  const { data } = await axiosInstance.post<{ asset: IAsset }>("/assets", payload);
  return data.asset;
}

export async function updateAsset(
  id: string,
  payload: { title?: string; kind?: AssetKind; unit?: string; unitPrice?: string; note?: string },
) {
  const { data } = await axiosInstance.put<{ asset: IAsset }>(`/assets/${id}`, payload);
  return data.asset;
}

export async function softDeleteAsset(id: string) {
  await axiosInstance.delete(`/assets/${id}/soft`);
}

export async function fetchAssetTrades(id: string) {
  const { data } = await axiosInstance.get<{ trades: IAssetTrade[] }>(`/assets/${id}/trades`);
  return data.trades;
}

export async function createAssetTrade(
  id: string,
  payload: {
    side: "buy" | "sell";
    quantity: string;
    totalPrice: string;
    year: string;
    month: string;
    day: string;
    note?: string;
    recordTransaction?: boolean;
    categoryId?: string;
    paymentCardId?: string;
  },
) {
  const { data } = await axiosInstance.post<{ trade: IAssetTrade }>(`/assets/${id}/trades`, payload);
  return data.trade;
}

export async function deleteAssetTrade(id: string, tradeId: string) {
  await axiosInstance.delete(`/assets/${id}/trades/${tradeId}`);
}
