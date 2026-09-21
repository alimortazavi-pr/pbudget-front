"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { MySubscriptionResponse } from "@/common/interfaces/subscription.interface";
import { useAppSelector } from "@/stores/hooks";
import { didTryAutoLoginSelector, isAuthSelector } from "@/stores/auth";

type SubscriptionAccessContextValue = {
  data: MySubscriptionResponse | null;
  loading: boolean;
  isFeatureEnabled: (key: string) => boolean;
};

const SubscriptionAccessContext = createContext<SubscriptionAccessContextValue | null>(null);

export function SubscriptionAccessProvider({ children }: { children: ReactNode }) {
  const isAuth = useAppSelector(isAuthSelector);
  const didTryAutoLogin = useAppSelector(didTryAutoLoginSelector);
  const [data, setData] = useState<MySubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [didTryAutoLogin, isAuth]);

  const value = useMemo<SubscriptionAccessContextValue>(
    () => ({
      data,
      loading,
      isFeatureEnabled: (key: string) => Boolean(data?.subscription && data.entitlements[key]?.enabled),
    }),
    [data, loading],
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
