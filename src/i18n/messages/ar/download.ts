import type { MessageTree } from "../../types";

export const downloadMessages: MessageTree = {
  copyLink: "نسخ الرابط",
  webLogin: "دخول الويب",
  badge: "تطبيق أندرويد {{appName}}",
  headline: "مكتب مالي وتخطيط",
  headlineAccent: "دائماً في جيبك",
  description:
    "{{tagline}}. إصدار أندرويد قريباً — استخدم الويب أو PWA حالياً.",
  descriptionReady:
    "{{tagline}}. إصدار أندرويد جاهز — أو استخدم الويب و PWA.",
  downloadApk: "تنزيل APK مباشر",
  comingSoon: "قريباً",
  versionInfo: "الإصدار {{version}} · أندرويد 7 فأعلى",
  features: {
    finance: {
      title: "إدارة مالية",
      desc: "معاملات، تحليل، ديون، أقساط وشيكات",
    },
    native: {
      title: "تطبيق أصلي",
      desc: "بدون WebView — سريع وسلس على أندرويد",
    },
    secure: {
      title: "آمن ومتعدد اللغات",
      desc: "RTL كامل، تقويم، دخول بالجوال",
    },
  },
  mockRows: {
    "0": "دفع · شراء",
    "1": "استلام · مشروع",
    "2": "قسط شهري",
  },
  installTitle: "تثبيت التطبيق",
  steps: {
    "0": "اضغط زر التنزيل",
    "1": "فعّل التثبيت من مصادر غير معروفة في الإعدادات",
    "2": "سجّل الدخول برقم الجوال",
  },
  pageLinkLabel: "رابط الصفحة:",
};
