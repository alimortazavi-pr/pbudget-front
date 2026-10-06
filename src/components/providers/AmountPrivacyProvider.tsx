"use client";

import { Fragment, useEffect, useSyncExternalStore, type ReactNode } from "react";

import {
  areAmountsHidden,
  getAmountPrivacyVersion,
  initAmountPrivacy,
  setAmountsHidden,
  subscribeAmountPrivacy,
} from "@/common/utils/amount-privacy";

/**
 * Money is formatted by plain functions, so React cannot know when the privacy
 * switch flips. Re-keying the subtree is the one change that refreshes every
 * formatted amount, including memoised rows and chart labels.
 */
export function AmountPrivacyBoundary({ children }: { children: ReactNode }) {
  const version = useSyncExternalStore(subscribeAmountPrivacy, getAmountPrivacyVersion, () => 0);
  useEffect(() => {
    initAmountPrivacy();
  }, []);
  return <Fragment key={version}>{children}</Fragment>;
}

/** `[hidden, toggle]` for the eye button. */
export function useAmountsHidden() {
  const hidden = useSyncExternalStore(subscribeAmountPrivacy, areAmountsHidden, () => false);
  return [hidden, () => setAmountsHidden(!hidden)] as const;
}
