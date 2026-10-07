"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import * as bankImportApi from "@/common/api/bank-import";
import { deleteDraft, loadDraft, saveDraft } from "@/common/utils/draft-store";
import type { ImportRowDraft } from "@/components/pages/bank-import/import-row.types";

const VERSION = 1;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const LOCAL_DELAY_MS = 600;
const SERVER_DELAY_MS = 2000;

/** Everything needed to continue an import exactly where the user left it. */
export interface BankImportDraft {
  bankId: string;
  fileName: string;
  rows: ImportRowDraft[];
  meta: Record<string, string | undefined>;
  duplicateCount: number;
  rangeFromDay: string;
  rangeToDay: string;
}

/** saved = on the server; local = only in this browser (server unreachable). */
export type DraftStatus = "idle" | "saving" | "saved" | "local" | "unavailable";

/**
 * Keeps the review step safe. The account (server) copy is the main one, so the
 * work follows the user to any device; a copy in this browser is written first
 * and covers a refresh or a dropped connection. On load the newer copy wins.
 */
export function useBankImportDraft(userId: string | undefined) {
  const key = userId ? `bank-import:${userId}` : null;
  const [stored, setStored] = useState<{ draft: BankImportDraft; savedAt: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const latest = useRef<BankImportDraft | null>(null);
  const localDirty = useRef(false);
  const serverDirty = useRef(false);
  const localTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverBusy = useRef(false);
  const localOk = useRef(true);
  const serverOk = useRef(true);
  // The server flush retries itself, so it calls through a ref instead of its own name.
  const retryServer = useRef<() => void>(() => undefined);

  const report = useCallback(() => {
    if (localDirty.current || serverDirty.current || serverBusy.current) return;
    if (serverOk.current) {
      setStatus("saved");
      setSavedAt(Date.now());
    } else if (localOk.current) {
      setStatus("local");
    } else {
      setStatus("unavailable");
    }
  }, []);

  const flushLocal = useCallback(async () => {
    if (localTimer.current) clearTimeout(localTimer.current);
    localTimer.current = null;
    if (!key || !localDirty.current || !latest.current) return;
    localDirty.current = false;
    localOk.current = await saveDraft(key, latest.current, VERSION);
    report();
  }, [key, report]);

  const flushServer = useCallback(async () => {
    if (serverTimer.current) clearTimeout(serverTimer.current);
    serverTimer.current = null;
    if (!key || serverBusy.current || !serverDirty.current || !latest.current) return;
    serverBusy.current = true;
    serverDirty.current = false;
    try {
      await bankImportApi.saveBankImportDraft(latest.current);
      serverOk.current = true;
    } catch {
      serverOk.current = false;
      // Try again later; the local copy already protects the work.
      serverDirty.current = true;
      serverTimer.current = setTimeout(() => retryServer.current(), SERVER_DELAY_MS * 5);
    } finally {
      serverBusy.current = false;
      if (serverDirty.current && serverOk.current) retryServer.current();
      report();
    }
  }, [key, report]);

  useEffect(() => {
    retryServer.current = () => void flushServer();
  }, [flushServer]);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void (async () => {
      const [local, server] = await Promise.all([
        loadDraft<BankImportDraft>(key, VERSION, MAX_AGE_MS),
        bankImportApi.fetchBankImportDraft().catch(() => undefined),
      ]);
      if (cancelled) return;
      const serverDraft = server ? ({ ...server, rows: server.rows as ImportRowDraft[] } as BankImportDraft) : null;
      const serverTime = server?.updatedAt ? new Date(server.updatedAt).getTime() : 0;
      const localTime = local?.savedAt ?? 0;
      const pick =
        serverDraft && serverDraft.rows.length && serverTime >= localTime
          ? { draft: serverDraft, savedAt: serverTime }
          : local && local.value.rows?.length
            ? { draft: local.value, savedAt: localTime }
            : null;
      if (server === undefined) serverOk.current = false;
      setStored(pick);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  /** Queue the latest state; only the last call within each delay is written. */
  const save = useCallback(
    (draft: BankImportDraft) => {
      if (!key) return;
      latest.current = draft;
      localDirty.current = true;
      serverDirty.current = true;
      setStatus("saving");
      if (localTimer.current) clearTimeout(localTimer.current);
      localTimer.current = setTimeout(() => void flushLocal(), LOCAL_DELAY_MS);
      if (serverTimer.current) clearTimeout(serverTimer.current);
      serverTimer.current = setTimeout(() => void flushServer(), SERVER_DELAY_MS);
    },
    [key, flushLocal, flushServer],
  );

  const clear = useCallback(async () => {
    for (const timer of [localTimer, serverTimer]) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    }
    latest.current = null;
    localDirty.current = false;
    serverDirty.current = false;
    setStored(null);
    setStatus("idle");
    setSavedAt(null);
    if (key) await deleteDraft(key);
    await bankImportApi.deleteBankImportDraft().catch(() => undefined);
  }, [key]);

  // Do not lose the last edits when the tab is hidden or closed.
  useEffect(() => {
    const flushAll = () => {
      void flushLocal();
      void flushServer();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (localDirty.current || serverDirty.current) {
        flushAll();
        // Only warn when not even the browser copy is safe yet.
        if (!localOk.current) event.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flushAll();
    };
  }, [flushLocal, flushServer]);

  return { stored, loaded, status, savedAt, save, clear, dismiss: () => setStored(null) };
}
