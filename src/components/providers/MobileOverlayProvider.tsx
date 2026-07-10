"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";

type MobileOverlayContextValue = {
  count: number;
  register: () => () => void;
};

const MobileOverlayContext = createContext<MobileOverlayContextValue | null>(
  null,
);

export const MobileOverlayProvider: FC<PropsWithChildren> = ({ children }) => {
  const [count, setCount] = useState(0);

  const register = useCallback(() => {
    setCount((current) => current + 1);
    return () => setCount((current) => Math.max(0, current - 1));
  }, []);

  const value = useMemo(() => ({ count, register }), [count, register]);

  return (
    <MobileOverlayContext.Provider value={value}>
      {children}
    </MobileOverlayContext.Provider>
  );
};

export function useMobileOverlay() {
  const ctx = useContext(MobileOverlayContext);
  if (!ctx) {
    throw new Error(
      "useMobileOverlay must be used within MobileOverlayProvider",
    );
  }
  return ctx;
}

export function useRegisterMobileOverlay(open: boolean) {
  const { register } = useMobileOverlay();

  useEffect(() => {
    if (!open) return;
    return register();
  }, [open, register]);
}
