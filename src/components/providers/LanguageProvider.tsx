"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fa");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pb_lang") as Language;
    if (saved && (saved === "fa" || saved === "en" || saved === "ar")) {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dir = language === "en" ? "ltr" : "rtl";
    document.documentElement.lang = language;
    localStorage.setItem("pb_lang", language);
    setI18nState(language, true);
  }, [language, mounted]);

  useEffect(() => {
    setI18nState(language, mounted);
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = createTranslator(language, mounted);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
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
