import type { ILandingContent } from "@/common/interfaces/landing.interface";

export const DEFAULT_LANDING_CONTENT: ILandingContent = {
  hero: {
    badge: "نسل ۲۰۲۶ — مدیریت مالی شخصی",
    title: "میز پردیس",
    tagline: "مدیریت مالی، پروژه و برنامه روزانه",
    description:
      "میز کاری که مالی شخصی، بودجه‌بندی، تحلیل هزینه، پروژه فریلنسری و برنامه روزانه را در یک تجربه حرفه‌ای جمع کرده — ساخته‌شده برای ایران.",
    primaryCta: "شروع رایگان",
    secondaryCta: "کاوش امکانات",
  },
  stats: [
    { value: "۱۵+", label: "ماژول مالی" },
    { value: "۱۰۰٪", label: "تقویم شمسی" },
    { value: "PWA", label: "نصب روی موبایل" },
    { value: "۲۴/۷", label: "دسترسی ابری" },
  ],
  nav: [
    { id: "features", label: "امکانات" },
    { id: "pricing", label: "قیمت‌ها" },
    { id: "why-us", label: "چرا ما" },
    { id: "how", label: "نحوه کار" },
    { id: "about", label: "درباره ما" },
    { id: "faq", label: "سوالات" },
    { id: "contact", label: "تماس" },
  ],
  features: [
    {
      id: "finance",
      title: "مدیریت مالی شخصی",
      description:
        "ثبت درآمد و هزینه با جزئیات کامل، داشبورد روزانه و ماهانه، نمودارهای تحلیلی و خروجی اکسل برای گزارش‌گیری.",
      tags: ["تراکنش", "تحلیل", "اکسل"],
      accent: "rose",
      span: "sm",
    },
    {
      id: "boxes",
      title: "صندوق‌ها و کارت‌های بانکی",
      description:
        "چند صندوق نقدی، کارت بانکی و کیف پول مجازی با موجودی لحظه‌ای و انتقال بین صندوق‌ها.",
      tags: ["صندوق", "کارت"],
      accent: "teal",
      span: "sm",
    },
    {
      id: "bank",
      title: "ورود خودکار از بانک",
      description:
        "وارد کردن تراکنش‌ها از صورتحساب بانک‌های ایرانی — بدون ثبت دستی تک‌تک ردیف‌ها.",
      tags: ["بانک", "ایمپورت"],
      accent: "violet",
      span: "sm",
    },
    {
      id: "categories",
      title: "دسته‌بندی و بودجه",
      description:
        "دسته‌بندی هوشمند هزینه‌ها، سقف بودجه ماهانه و هشدار هنگام نزدیک شدن به حد مجاز.",
      tags: ["بودجه", "دسته"],
      accent: "rose",
      span: "sm",
    },
    {
      id: "debts",
      title: "طلب، بدهی و اقساط",
      description:
        "پیگیری طلب و بدهی، برنامه اقساط با یادآور، مدیریت چک‌ها و تعهدات جاری.",
      tags: ["اقساط", "چک"],
      accent: "teal",
      span: "sm",
    },
    {
      id: "planning",
      title: "برنامه روزانه و یادداشت",
      description:
        "وظایف روزانه با اولویت‌بندی، یادداشت‌های سریع و تقویم شمسی یکپارچه.",
      tags: ["تسک", "نوت"],
      accent: "violet",
      span: "sm",
    },
    {
      id: "projects",
      title: "پروژه و زمان فریلنسری",
      description:
        "مدیریت پروژه‌های کاری، ثبت ساعت کار، هدف ماهانه و گزارش زمان صرف‌شده.",
      tags: ["پروژه", "تایم‌لاین"],
      accent: "rose",
      span: "sm",
    },
    {
      id: "ventures",
      title: "مشارکت و سرمایه‌گذاری",
      description:
        "ثبت سرمایه‌گذاری مشترک با شریک، تسویه حساب و دعوت همکار به پروژه مشترک.",
      tags: ["شریک", "سرمایه"],
      accent: "teal",
      span: "sm",
    },
    {
      id: "voice",
      title: "دستیار صوتی و تلگرام",
      description:
        "ثبت تراکنش با صدا، اعلان تلگرام برای یادآوری اقساط و درخواست‌های مالی.",
      tags: ["صدا", "بات"],
      accent: "violet",
      span: "sm",
    },
    {
      id: "analysis",
      title: "تحلیل و گزارش مالی",
      description:
        "نمودار روند درآمد و هزینه، مقایسه ماه‌ها، شناسایی الگوهای خرج و خروجی اکسل.",
      tags: ["نمودار", "گزارش"],
      accent: "rose",
      span: "sm",
    },
  ],
  whyUs: [
    {
      title: "همه‌چیز در یک میز",
      description:
        "به‌جای چند اپ جدا برای بودجه، اقساط و پروژه — میز پردیس یک اکوسیستم یکپارچه است.",
    },
    {
      title: "ساخته‌شده برای ایران",
      description:
        "تقویم جلالی، تعطیلات رسمی، بانک‌های داخلی و اعداد فارسی.",
    },
    {
      title: "تحلیل هوشمند",
      description:
        "داشبورد زنده، نمودارهای تعاملی و هشدار بودجه برای کنترل بهتر هزینه‌ها.",
    },
    {
      title: "امنیت و حریم خصوصی",
      description:
        "داده‌های مالی شما فقط متعلق به شماست — رمزنگاری و احراز هویت امن.",
    },
    {
      title: "وب + PWA",
      description:
        "نصب روی موبایل از مرورگر بدون نیاز به اپ‌استور — همیشه در دسترس.",
    },
    {
      title: "رایگان شروع کنید",
      description:
        "ورود با موبایل — بدون پیچیدگی و بدون نیاز به کارت اعتباری.",
    },
  ],
  howSteps: [
    {
      step: "۱",
      title: "ثبت‌نام با موبایل",
      description: "شماره موبایل خود را وارد کنید و کد تأیید را دریافت کنید.",
    },
    {
      step: "۲",
      title: "تنظیم صندوق‌ها",
      description: "صندوق‌های نقدی و کارت‌های بانکی خود را تعریف کنید.",
    },
    {
      step: "۳",
      title: "ثبت اولین تراکنش",
      description: "درآمد و هزینه‌ها را ثبت کنید یا از بانک وارد کنید.",
    },
    {
      step: "۴",
      title: "تحلیل و کنترل",
      description: "داشبورد و نمودارها را ببینید و بودجه ماهانه تنظیم کنید.",
    },
  ],
  faq: [
    {
      q: "آیا رایگان است؟",
      a: "بله — تمام امکانات مالی شخصی به‌صورت رایگان در دسترس است.",
    },
    {
      q: "آیا از بانک‌های ایرانی پشتیبانی می‌کند؟",
      a: "بله — می‌توانید صورتحساب بانک‌های داخلی را وارد کنید.",
    },
    {
      q: "آیا داده‌های من امن است؟",
      a: "بله — احراز هویت امن و ذخیره‌سازی ابری با رمزنگاری.",
    },
    {
      q: "آیا اپ موبایل دارید؟",
      a: "نسخه وب و PWA آماده است — نصب از مرورگر روی موبایل.",
    },
    {
      q: "آیا تقویم شمسی دارد؟",
      a: "بله — تمام تاریخ‌ها و گزارش‌ها بر اساس تقویم جلالی هستند.",
    },
  ],
  contact: {
    title: "تماس با ما",
    description: "سوال، همکاری یا پشتیبانی — در خدمتیم.",
    email: "hello@pdesk.ir",
    telegram:
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ??
      "paradisebudget_bot",
    phone: "09125519818",
  },
  about: {
    title: "ساخته‌شده با عشق برای کاربران ایرانی",
    paragraphs: [
      "میز پردیس حاصل نیاز واقعی کاربران ایرانی است: یک ابزار مالی شخصی بومی که همه‌چیز را در یک جا جمع کند.",
      "هر هفته بر اساس بازخورد شما بهتر می‌شویم.",
    ],
  },
  marquee: [
    "مدیریت مالی",
    "بودجه‌بندی",
    "تقویم شمسی",
    "گزارش اکسل",
    "بات تلگرام",
    "دستیار صوتی",
    "ورود از بانک",
    "تحلیل هزینه",
  ],
  settings: {
    downloadComingSoon: true,
    downloadLabel: "به‌زودی",
    showAppDownloadInNav: true,
  },
  pricing: {
    eyebrow: "قیمت‌گذاری شفاف",
    title: "رایگان برای همیشه",
    description:
      "تمام امکانات مدیریت مالی شخصی رایگان است. بدون محدودیت تراکنش، بدون تبلیغات مزاحم.",
    plans: [
      {
        id: "personal",
        name: "شخصی",
        price: "رایگان",
        period: "برای همیشه",
        description: "میز مالی شخصی کامل — بودجه، تحلیل، پروژه و برنامه روزانه",
        features: [
          "تراکنش و دسته‌بندی نامحدود",
          "داشبورد و تحلیل مالی پیشرفته",
          "صندوق‌ها، کارت‌ها و ورود از بانک",
          "طلب، بدهی، اقساط و چک",
          "پروژه، تسک و تقویم شمسی",
          "مشارکت با شریک و سرمایه‌گذاری",
          "دستیار صوتی و بات تلگرام",
          "PWA — نصب روی موبایل",
        ],
        cta: "شروع رایگان",
        highlighted: true,
      },
      {
        id: "business",
        name: "میز کسب‌وکار",
        price: "محصول جدا",
        period: "پلن ماهانه",
        description:
          "حضور GPS، پرسنل، شیفت و مالی تیمی — روی دامنه و اپ جداگانه",
        features: [
          "ثبت حضور با Geofence",
          "مدیریت پرسنل و دعوت QR",
          "مالی تیمی و تنخواه",
          "گزارش حضور و مرخصی",
          "اتصال SSO با حساب شخصی",
        ],
        cta: "رفتن به business.pdesk.ir",
        highlighted: false,
        externalUrl:
          process.env.NEXT_PUBLIC_BUSINESS_SITE_URL ?? "https://business.pdesk.ir",
      },
      {
        id: "support",
        name: "سازمانی",
        price: "تماس",
        period: "قراردادی",
        description: "استقرار سازمانی، مهاجرت داده یا دمو زنده می‌خواهید؟",
        features: [
          "دمو اختصاصی محصول",
          "راه‌اندازی برای تیم",
          "پشتیبانی و آموزش",
        ],
        cta: "تماس با ما",
        highlighted: false,
      },
    ],
  },
  seo: {
    title: "میز پردیس — مدیریت مالی شخصی",
    description:
      "میز کار شخصی برای مدیریت مالی، بودجه‌بندی، تحلیل هزینه، پروژه فریلنسری و تقویم شمسی.",
    ogImageUrl: "/assets/logo-mark.svg",
  },
};

/** @deprecated use DEFAULT_LANDING_CONTENT */
export const LANDING_NAV = DEFAULT_LANDING_CONTENT.nav;
export const LANDING_STATS = DEFAULT_LANDING_CONTENT.stats;
export const LANDING_FEATURES = DEFAULT_LANDING_CONTENT.features;
export const WHY_US = DEFAULT_LANDING_CONTENT.whyUs;
export const HOW_STEPS = DEFAULT_LANDING_CONTENT.howSteps;
export const FAQ_ITEMS = DEFAULT_LANDING_CONTENT.faq;
export const CONTACT = DEFAULT_LANDING_CONTENT.contact;
