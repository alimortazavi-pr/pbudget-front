"use client";

import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { useHydrated } from "@/common/hooks/useHydrated";

/**
 * Reads URL search params only after hydration so server HTML matches the first client paint.
 */
export function useHydratedSearchParams() {
  const searchParams = useSearchParams();
  const hydrated = useHydrated();

  const get = useCallback(
    (key: string, fallback = "") => {
      if (!hydrated) return fallback;
      return searchParams.get(key) ?? fallback;
    },
    [hydrated, searchParams],
  );

  const getAll = useCallback(() => {
    if (!hydrated) return new URLSearchParams();
    return new URLSearchParams(searchParams.toString());
  }, [hydrated, searchParams]);

  return { hydrated, get, getAll, searchParams };
}
