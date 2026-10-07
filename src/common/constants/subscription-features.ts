export const SUBSCRIPTION_FEATURE_CATALOG = [
  { key: "debts", labelKey: "nav.debts", label: "طلب و بدهی" },
  { key: "installments", labelKey: "nav.installments", label: "اقساط" },
  { key: "checks", labelKey: "nav.checks", label: "چک‌ها" },
  { key: "bank_import", labelKey: "nav.bankImport", label: "ورود صورتحساب بانکی" },
  { key: "work_time", labelKey: "nav.workAttendance", label: "تردد و ساعات کاری" },
  { key: "custom_exports", labelKey: "nav.customExports", label: "خروجی اختصاصی شرکت" },
  { key: "analytics", labelKey: "nav.financialAnalysis", label: "تحلیل مالی و گزارش‌ها" },
  { key: "planner", labelKey: "nav.dailyPlanner", label: "برنامه روزانه" },
  { key: "projects", labelKey: "nav.projects", label: "پروژه‌ها" },
  { key: "partners", labelKey: "nav.businessPartners", label: "شرکا و تسویه" },
  { key: "ai", labelKey: "nav.aiAssistant", label: "دستیار و تحلیل هوشمند (AI)" },
] as const;

export type SubscriptionFeatureKey = (typeof SUBSCRIPTION_FEATURE_CATALOG)[number]["key"];
