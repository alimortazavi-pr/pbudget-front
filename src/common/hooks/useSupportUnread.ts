"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { fetchAdminSupportPulse, fetchUnreadSupportCount } from "@/common/api/support";

const CHANGED_EVENT = "pdesk:support-changed";
const POLL_MS = 60_000;

/** Tell every badge to re-check now (after reading or answering a conversation). */
export function notifySupportChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGED_EVENT));
}

/**
 * One shared poller per kind of badge, however many components show it: the
 * count refreshes every minute while the tab is visible, on focus, on
 * navigation and whenever `notifySupportChanged()` fires.
 */
function createStore(fetchCount: () => Promise<number>) {
  let count = 0;
  const listeners = new Set<() => void>();
  let timer: number | null = null;
  let inFlight = false;

  const emit = () => listeners.forEach((listener) => listener());
  const refresh = async () => {
    if (inFlight || document.visibilityState !== "visible") return;
    inFlight = true;
    try {
      const next = await fetchCount();
      if (next !== count) {
        count = next;
        emit();
      }
    } catch {
      // Signed out or offline: keep the last value.
    } finally {
      inFlight = false;
    }
  };
  const onVisible = () => void refresh();

  return {
    refresh,
    getSnapshot: () => count,
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        void refresh();
        timer = window.setInterval(() => void refresh(), POLL_MS);
        window.addEventListener(CHANGED_EVENT, onVisible);
        window.addEventListener("focus", onVisible);
        document.addEventListener("visibilitychange", onVisible);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          if (timer) window.clearInterval(timer);
          timer = null;
          window.removeEventListener(CHANGED_EVENT, onVisible);
          window.removeEventListener("focus", onVisible);
          document.removeEventListener("visibilitychange", onVisible);
        }
      };
    },
  };
}

const userStore = createStore(fetchUnreadSupportCount);
const adminStore = createStore(async () => (await fetchAdminSupportPulse()).unread);

function useStore(store: ReturnType<typeof createStore>) {
  const pathname = usePathname();
  const count = useSyncExternalStore(store.subscribe, store.getSnapshot, () => 0);
  // Re-check on navigation, so the badge clears after the conversation is opened.
  useEffect(() => {
    void store.refresh();
  }, [pathname, store]);
  return count;
}

/** Number of support conversations with an admin reply the user has not read yet. */
export function useSupportUnread() {
  return useStore(userStore);
}

/** Number of conversations with a user message no admin has opened yet. */
export function useAdminSupportUnread() {
  return useStore(adminStore);
}
