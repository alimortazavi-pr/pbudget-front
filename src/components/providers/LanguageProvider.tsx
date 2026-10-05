"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  createTranslator,
  setI18nState,
  type Language,
  type TranslationParams,
} from "@/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: TranslationParams) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export type { Language };

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "fa";
  const saved = localStorage.getItem("pb_lang") as Language;
  if (saved === "fa" || saved === "en" || saved === "ar") return saved;
  return "fa";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fa");
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    setLanguageState(readStoredLanguage());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = language === "en" ? "ltr" : "rtl";
    document.documentElement.lang = language;
    localStorage.setItem("pb_lang", language);
    setI18nState(language, true);
  }, [language, mounted]);

  // Set during render so helpers used by children (module-level `t`, digit
  // formatting) already see the right language in this same render pass.
  setI18nState(language, mounted);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useMemo(() => createTranslator(language, mounted), [language, mounted]);
  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {/* Persian (the SSR language) never remounts; other languages remount the
          tree once so components with module-level translations re-render. */}
      <React.Fragment key={mounted && language !== "fa" ? language : "fa"}>
        {children}
      </React.Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
