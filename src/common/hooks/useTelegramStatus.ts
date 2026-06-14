"use client";

import { useCallback, useEffect, useState } from "react";

import * as profileApi from "@/common/api/profile";

export const TELEGRAM_STATUS_EVENT = "pbudget:telegram-status";

export function notifyTelegramStatusChanged() {
  window.dispatchEvent(new Event(TELEGRAM_STATUS_EVENT));
}

export function useTelegramStatus() {
  const [linked, setLinked] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const status = await profileApi.fetchTelegramStatus();
      setLinked(status.linked);
      setBotUsername(status.botUsername);
    } catch {
      setLinked(false);
      setBotUsername(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = () => {
      void refresh();
    };
    window.addEventListener(TELEGRAM_STATUS_EVENT, handler);
    return () => window.removeEventListener(TELEGRAM_STATUS_EVENT, handler);
  }, [refresh]);

  return { linked, botUsername, loading, refresh };
}
