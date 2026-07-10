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

import type { ExperienceMode } from "@/common/constants/experience";
import {
  getStoredExperience,
  setStoredExperience,
} from "@/common/utils/experience";

type ExperienceContextValue = {
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  mounted: boolean;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export const ExperienceProvider: FC<PropsWithChildren> = ({ children }) => {
  const [experienceMode, setExperienceModeState] =
    useState<ExperienceMode>("classic");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setExperienceModeState(getStoredExperience());
    setMounted(true);
  }, []);

  const setExperienceMode = useCallback((mode: ExperienceMode) => {
    setExperienceModeState(mode);
    setStoredExperience(mode);
  }, []);

  const value = useMemo(
    () => ({ experienceMode, setExperienceMode, mounted }),
    [experienceMode, setExperienceMode, mounted],
  );

  return (
    <ExperienceContext.Provider value={value}>
      {children}
    </ExperienceContext.Provider>
  );
};

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) {
    throw new Error("useExperience must be used within ExperienceProvider");
  }
  return ctx;
}
