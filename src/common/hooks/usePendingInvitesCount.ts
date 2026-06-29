"use client";

import { useCallback, useEffect, useState } from "react";

import * as partnersApi from "@/common/api/partners";

export const PENDING_INVITES_EVENT = "pbudget:pending-invites";

export function notifyPendingInvitesChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PENDING_INVITES_EVENT));
  }
}

export function usePendingInvitesCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const partners = await partnersApi.fetchPendingInvites();
      setCount(partners.length);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      void refresh();
    };
    window.addEventListener(PENDING_INVITES_EVENT, handler);
    return () => window.removeEventListener(PENDING_INVITES_EVENT, handler);
  }, [refresh]);

  return { count, loading, refresh };
}
