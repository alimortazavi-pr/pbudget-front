"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "fa" | "en" | "ar";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  fa: {
    dashboard: "داشبورد",
    boxes: "صندوق‌ها",
    categories: "دسته‌بندی‌ها",
    debts: "بدهی و طلب",
    planning: "برنامه‌ریزی",
    partners: "همکاران",
    bankImport: "ورود از بانک",
    reports: "گزارش‌ها",
    settings: "تنظیمات",
    daily: "روزانه",
    monthly: "ماهانه",
    yearly: "سالانه",
    all: "نمای کلی",
    help: "راهنما",
    changeAccount: "تغییر حساب",
    toman: "تومان",
    dollar: "دلار",
    dinar: "دینار",
    home: "خانه",
    bankImportFull: "ورود از صورتحساب بانک",
    financialAnalysis: "تحلیل مالی",
    myCards: "کارت‌های من",
    dailyPlanner: "برنامه روزانه",
    notes: "یادداشت‌ها",
    projects: "پروژه‌ها",
    businessPartners: "شرکا و تسویه",
    workAttendance: "حضور فریلنسری",
    installments: "اقساط",
    checks: "چک‌ها",
    commitments: "تعهدات جاری",
    profile: "پروفایل",
    telegramBot: "بات تلگرام",
    more: "بیشتر",
    create: "ثبت",
    advancedFinance: "مالی پیشرفته",
    partnership: "مشارکت",
    personalDesk: "میز شخصی",
    switchAccount: "تغییر حساب",
    themeToggle: "تغییر تم",
    primary: "اصلی",
  },
  en: {
    dashboard: "Dashboard",
    boxes: "Boxes",
    categories: "Categories",
    debts: "Debts",
    planning: "Planning",
    partners: "Partners",
    bankImport: "Bank Import",
    reports: "Reports",
    settings: "Settings",
    daily: "Daily",
    monthly: "Monthly",
    yearly: "Yearly",
    all: "Overview",
    help: "Help",
    changeAccount: "Switch Account",
    toman: "Toman",
    dollar: "USD",
    dinar: "IQD",
    home: "Home",
    bankImportFull: "Bank Import",
    financialAnalysis: "Analysis",
    myCards: "My Cards",
    dailyPlanner: "Daily Planner",
    notes: "Notes",
    projects: "Projects",
    businessPartners: "Partners",
    workAttendance: "Freelance Clock",
    installments: "Installments",
    checks: "Checks",
    commitments: "Commitments",
    profile: "Profile",
    telegramBot: "Telegram Bot",
    more: "More",
    create: "Create",
    advancedFinance: "Advanced",
    partnership: "Collaboration",
    personalDesk: "Personal Desk",
    switchAccount: "Switch Account",
    themeToggle: "Theme Toggle",
    primary: "Main",
  },
  ar: {
    dashboard: "لوحة القيادة",
    boxes: "الصناديق",
    categories: "الفئات",
    debts: "الديون",
    planning: "التخطيط",
    partners: "الشركاء",
    bankImport: "استيراد بنكي",
    reports: "التقارير",
    settings: "الإعدادات",
    daily: "يومي",
    monthly: "شهري",
    yearly: "سنوي",
    all: "نظرة عامة",
    help: "مساعدة",
    changeAccount: "تغيير الحساب",
    toman: "تومان",
    dollar: "دولار",
    dinar: "دينار",
    home: "الرئيسية",
    bankImportFull: "استيراد بنكي",
    financialAnalysis: "تحليل مالي",
    myCards: "بطاقاتي",
    dailyPlanner: "البرنامج اليومي",
    notes: "ملاحظات",
    projects: "المشاريع",
    businessPartners: "الشركاء والتسوية",
    workAttendance: "حضور العمل الحر",
    installments: "الأقساط",
    checks: "الشيكات",
    commitments: "الالتزامات",
    profile: "الملف الشخصي",
    telegramBot: "بوت تلغرام",
    more: "المزيد",
    create: "تسجيل",
    advancedFinance: "المالية المتقدمة",
    partnership: "الشراكة",
    personalDesk: "المكتب الشخصي",
    switchAccount: "تغيير الحساب",
    themeToggle: "تغيير المظهر",
    primary: "الرئيسي",
  },
};

// Map original labels to translation keys
const labelToKeyMap: Record<string, string> = {
  "خانه": "home",
  "ورود از بانک": "bankImport",
  "ورود از صورتحساب بانک": "bankImportFull",
  "تحلیل مالی": "financialAnalysis",
  "صندوق‌ها": "boxes",
  "کارت‌های من": "myCards",
  "دسته‌بندی‌ها": "categories",
  "برنامه روزانه": "dailyPlanner",
  "یادداشت‌ها": "notes",
  "پروژه‌ها": "projects",
  "شرکا و تسویه": "businessPartners",
  "حضور فریلنسری": "workAttendance",
  "طلب و بدهی": "debts",
  "اقساط": "installments",
  "چک‌ها": "checks",
  "تعهدات جاری": "commitments",
  "پروفایل": "profile",
  "تنظیمات": "settings",
  "بات تلگرام": "telegramBot",
  "بیشتر": "more",
  "ثبت": "create",
  "برنامه‌ریزی": "planning",
  "مالی پیشرفته": "advancedFinance",
  "مشارکت": "partnership",
  "میز شخصی": "personalDesk",
  "ثبت تراکنش": "create",
  "اصلی": "primary",
};

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
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const cleanKey = labelToKeyMap[key] || key;
    if (!mounted) {
      return translations.fa[cleanKey] || cleanKey;
    }
    return translations[language][cleanKey] || translations.fa[cleanKey] || cleanKey;
  };

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
