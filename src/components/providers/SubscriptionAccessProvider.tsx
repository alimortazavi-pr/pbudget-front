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
  /** The last fetch failed; `data` may still hold the last good answer. */
  error: boolean;
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
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setData(await subscriptionApi.fetchMySubscription());
      setError(false);
    } catch {
      // Keep the last good answer: a network blip must not lock paid features.
      setError(true);
    }
  }, []);

  useEffect(() => {
    if (!didTryAutoLogin) return;
    if (!isAuth) {
      setData(null);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void subscriptionApi
      .fetchMySubscription()
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setError(false);
      })
      .catch(() => {
        // A different account must never inherit the previous account's plan.
        if (cancelled) return;
        setData(null);
        setError(true);
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
      error,
      isFeatureEnabled: (key: string) => Boolean(data?.subscription && data.entitlements[key]?.enabled),
      refresh,
    }),
    [data, loading, error, refresh],
  );

  return <SubscriptionAccessContext.Provider value={value}>{children}</SubscriptionAccessContext.Provider>;
}

/** Same as useSubscriptionAccess, but null outside the provider (e.g. admin). */
export function useOptionalSubscriptionAccess() {
  return useContext(SubscriptionAccessContext);
}

export function useSubscriptionAccess() {
  const context = useContext(SubscriptionAccessContext);
  if (!context) {
    throw new Error("useSubscriptionAccess must be used within SubscriptionAccessProvider");
  }
  return context;
}
