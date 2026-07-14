"use client";

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

import type { AppMode } from "@/common/constants/app-mode";
import { getStoredAppMode, setStoredAppMode } from "@/common/utils/app-mode";

type AppModeContextValue = {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  mounted: boolean;
  isSimple: boolean;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);

export const AppModeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [appMode, setAppModeState] = useState<AppMode>("advanced");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAppModeState(getStoredAppMode());
    setMounted(true);
  }, []);

  const setAppMode = useCallback((mode: AppMode) => {
    setAppModeState(mode);
    setStoredAppMode(mode);
  }, []);

  const value = useMemo(
    () => ({
      appMode,
      setAppMode,
      mounted,
      isSimple: appMode === "simple",
    }),
    [appMode, setAppMode, mounted],
  );

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
};

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) {
    throw new Error("useAppMode must be used within AppModeProvider");
  }
  return ctx;
}
