/** Keys of every switchable feature. The full, grouped list (with defaults) comes from the API. */
export const SUBSCRIPTION_FEATURE_CATALOG = [
  { key: "boxes", label: "صندوق‌ها و اهداف پس‌انداز" },
  { key: "payment_cards", label: "کارت‌های من" },
  { key: "notes", label: "یادداشت‌ها" },
  { key: "debts", label: "طلب و بدهی" },
  { key: "installments", label: "اقساط" },
  { key: "checks", label: "چک‌ها" },
  { key: "commitments", label: "تعهدات جاری" },
  { key: "analytics", label: "تحلیل مالی و گزارش‌ها" },
  { key: "bank_import", label: "ورود صورتحساب بانکی" },
  { key: "custom_exports", label: "خروجی اختصاصی شرکت" },
  { key: "planner", label: "برنامه روزانه" },
  { key: "routines", label: "تسک‌های ثابت (روتین)" },
  { key: "projects", label: "پروژه‌ها" },
  { key: "partners", label: "شرکا و تسویه" },
  { key: "work_time", label: "تردد و ساعات کاری" },
  { key: "ai", label: "دستیار و تحلیل هوشمند (AI)" },
  { key: "ai_insights", label: "تحلیل هوشمند (AI)" },
  { key: "ai_plan", label: "برنامهٔ ماه بعد (AI)" },
  { key: "ai_chat", label: "گفتگو با دستیار (AI)" },
  { key: "telegram_bot", label: "اتصال بات تلگرام" },
  { key: "bale_bot", label: "اتصال بات بله" },
  { key: "theme_custom", label: "تم سفارشی و رنگ‌ها" },
  { key: "privacy_mode", label: "مخفی‌کردن مبالغ" },
] as const;

export type SubscriptionFeatureKey = (typeof SUBSCRIPTION_FEATURE_CATALOG)[number]["key"];
