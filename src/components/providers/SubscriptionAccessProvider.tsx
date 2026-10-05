"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { MySubscriptionResponse } from "@/common/interfaces/subscription.interface";
import { useAppSelector } from "@/stores/hooks";
import { didTryAutoLoginSelector, isAuthSelector } from "@/stores/auth";
import { userSelector } from "@/stores/profile";

type SubscriptionAccessContextValue = {
  data: MySubscriptionResponse | null;
  loading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  refresh: () => Promise<void>;
};

const SubscriptionAccessContext = createContext<SubscriptionAccessContextValue | null>(null);

export function SubscriptionAccessProvider({ children }: { children: ReactNode }) {
  const isAuth = useAppSelector(isAuthSelector);
  const didTryAutoLogin = useAppSelector(didTryAutoLoginSelector);
  const user = useAppSelector(userSelector);
  const userId = user?._id;
  const [data, setData] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setData(await subscriptionApi.fetchMySubscription());
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    if (!didTryAutoLogin) return;
    if (!isAuth) {
      setData(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void subscriptionApi
      .fetchMySubscription()
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Re-fetch when the active account changes (multi-account switch).
  }, [didTryAutoLogin, isAuth, userId]);

  useEffect(() => {
    if (!isAuth) return;
    // A plan approved by the admin should unlock features without a reload.
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuth, refresh]);

  const value = useMemo<SubscriptionAccessContextValue>(
    () => ({
      data,
      loading,
      isFeatureEnabled: (key: string) => Boolean(data?.subscription && data.entitlements[key]?.enabled),
      refresh,
    }),
    [data, loading, refresh],
  );

  return <SubscriptionAccessContext.Provider value={value}>{children}</SubscriptionAccessContext.Provider>;
}

export function useSubscriptionAccess() {
  const context = useContext(SubscriptionAccessContext);
  if (!context) {
    throw new Error("useSubscriptionAccess must be used within SubscriptionAccessProvider");
  }
  return context;
}
