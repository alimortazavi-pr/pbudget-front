"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { deleteDraft, loadDraft, saveDraft } from "@/common/utils/draft-store";
import type { ImportRowDraft } from "@/components/pages/bank-import/import-row.types";

const VERSION = 1;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 600;

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

export type DraftStatus = "idle" | "saving" | "saved" | "unavailable";

/**
 * Autosaves the review step to IndexedDB (debounced, and flushed when the tab is
 * hidden or closed) and offers the saved draft back after a refresh.
 */
export function useBankImportDraft(userId: string | undefined) {
  const key = userId ? `bank-import:${userId}` : null;
  const [stored, setStored] = useState<{ draft: BankImportDraft; savedAt: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<DraftStatus>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const pending = useRef<BankImportDraft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    void loadDraft<BankImportDraft>(key, VERSION, MAX_AGE_MS).then((found) => {
      if (cancelled) return;
      setStored(found && found.value.rows?.length ? { draft: found.value, savedAt: found.savedAt } : null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const flush = useCallback(async () => {
    if (!key || !pending.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const draft = pending.current;
    pending.current = null;
    const ok = await saveDraft(key, draft, VERSION);
    setStatus(ok ? "saved" : "unavailable");
    if (ok) setSavedAt(Date.now());
  }, [key]);

  /** Queue the latest state; only the last call within the delay is written. */
  const save = useCallback(
    (draft: BankImportDraft) => {
      if (!key) return;
      pending.current = draft;
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [key, flush],
  );

  const clear = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    pending.current = null;
    setStored(null);
    setStatus("idle");
    setSavedAt(null);
    if (key) await deleteDraft(key);
  }, [key]);

  // Do not lose the last edits when the tab is hidden or closed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current) {
        void flush();
        event.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flush();
    };
  }, [flush]);

  return { stored, loaded, status, savedAt, save, clear, dismiss: () => setStored(null) };
}
