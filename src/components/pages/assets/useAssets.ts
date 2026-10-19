"use client";

import { useCallback, useEffect, useState } from "react";

import * as assetsApi from "@/common/api/assets";
import * as profileApi from "@/common/api/profile";
import type { IAsset } from "@/common/interfaces/asset.interface";
import { showErrorToast } from "@/common/utils/toast";
import { useAppDispatch } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { setProfile } from "@/stores/profile";

/** Loads the user's assets and reloads them (plus the wallet) when something changes. */
export function useAssets() {
  const dispatch = useAppDispatch();
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await assetsApi.fetchAssets();
      setAssets(data.assets);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** A buy or sell can also touch the wallet and the transaction list. */
  const refreshWallet = useCallback(async () => {
    dispatch(bumpBudgetRevision());
    const profile = await profileApi.fetchProfile().catch(() => null);
    if (profile) dispatch(setProfile(profile));
  }, [dispatch]);

  return { assets, loading, reload, refreshWallet };
}
