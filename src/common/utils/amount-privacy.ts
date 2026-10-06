/*
 * Global "hide amounts" switch (the eye on the dashboard). Money formatters read
 * it, so every amount in the app — balances, transactions, charts — is masked
 * at once. The choice is remembered on this device.
 */
const STORAGE_KEY = "pb-hide-amounts";
const LEGACY_KEY = "pb-hide-balance";

export const AMOUNT_MASK = "••••••";

let hidden = false;
let version = 0;
let initialised = false;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/** Read the saved choice once, after hydration (never during server render). */
export function initAmountPrivacy() {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (saved === "1") {
      hidden = true;
      emit();
    }
  } catch {
    /* private mode: stay visible */
  }
}

export function areAmountsHidden() {
  return hidden;
}

export function setAmountsHidden(next: boolean) {
  if (next === hidden) return;
  hidden = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  emit();
}

export function subscribeAmountPrivacy(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Changes whenever the switch flips; used to re-render everything that shows money. */
export function getAmountPrivacyVersion() {
  return version;
}
