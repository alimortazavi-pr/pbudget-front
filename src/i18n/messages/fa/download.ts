import type { MessageTree } from "../../types";

export const downloadMessages: MessageTree = {
  copyLink: "کپی لینک",
  webLogin: "ورود وب",
  badge: "اپ اندروید {{appName}}",
  headline: "میز کار مالی و برنامه‌ریزی",
  headlineAccent: "همیشه در جیب شما",
  description:
    "{{tagline}}. نسخه اندروید به‌زودی منتشر می‌شود — فعلاً از نسخه وب یا PWA استفاده کنید.",
  descriptionReady:
    "{{tagline}}. نسخه اندروید آماده دانلود است — یا از نسخه وب و PWA استفاده کنید.",
  downloadApk: "دانلود مستقیم APK",
  comingSoon: "به‌زودی در دسترس",
  versionInfo: "نسخه {{version}} · اندروید ۷ به بالا",
  features: {
    finance: {
      title: "مدیریت مالی",
      desc: "تراکنش، تحلیل، طلب و بدهی، اقساط و چک",
    },
    native: {
      title: "کاملاً نیتیو",
      desc: "بدون WebView — سریع و روان روی اندروید",
    },
    secure: {
      title: "امن و فارسی",
      desc: "RTL کامل، تقویم شمسی، ورود با موبایل",
    },
  },
  mockRows: {
    "0": "پرداخت · خرید",
    "1": "دریافت · پروژه",
    "2": "قسط ماهانه",
  },
  installTitle: "نصب اپ",
  steps: {
    "0": "روی دکمه دانلود بزنید",
    "1": "نصب از منابع ناشناس را در تنظیمات فعال کنید",
    "2": "با شماره موبایل وارد شوید",
  },
  pageLinkLabel: "لینک این صفحه:",
};
