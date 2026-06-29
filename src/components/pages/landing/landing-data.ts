import type { ILandingContent } from "@/common/interfaces/landing.interface";

export const DEFAULT_LANDING_CONTENT: ILandingContent = {
  hero: {
    badge: "نسل ۲۰۲۶ — مالی · حضور · پروژه",
    title: "میز پردیس",
    tagline: "مدیریت مالی، پروژه و برنامه روزانه",
    description:
      "میز کاری که مالی شخصی، حضور GPS تیمی، پروژه فریلنسری و گزارش اکسل را در یک تجربه حرفه‌ای جمع کرده — ساخته‌شده برای ایران.",
    primaryCta: "شروع رایگان",
    secondaryCta: "کاوش امکانات",
  },
  stats: [
    { value: "۲۰+", label: "ماژول یکپارچه" },
    { value: "۱۰۰٪", label: "تقویم شمسی" },
    { value: "GPS", label: "حضور با موقعیت" },
    { value: "۲۴/۷", label: "دسترسی ابری" },
  ],
  nav: [
    { id: "features", label: "امکانات" },
    { id: "business", label: "کسب‌وکار" },
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
        "ثبت درآمد و هزینه، داشبورد روزانه و ماهانه، تحلیل نموداری و خروجی اکسل.",
      tags: ["تراکنش", "تحلیل", "اکسل"],
      accent: "rose",
      span: "md",
    },
    {
      id: "boxes",
      title: "صندوق‌ها و کارت‌ها",
      description: "چند صندوق نقدی، کارت بانکی و موجودی لحظه‌ای.",
      tags: ["صندوق", "کارت"],
      accent: "teal",
      span: "sm",
    },
    {
      id: "bank",
      title: "ورود از بانک",
      description: "وارد کردن خودکار تراکنش‌ها از صورتحساب بانک‌های ایرانی.",
      tags: ["بانک", "ایمپورت"],
      accent: "violet",
      span: "sm",
    },
    {
      id: "debts",
      title: "طلب، بدهی و اقساط",
      description: "پیگیری طلب و بدهی، برنامه اقساط، چک‌ها و تعهدات جاری.",
      tags: ["اقساط", "چک"],
      accent: "rose",
      span: "md",
    },
    {
      id: "planning",
      title: "برنامه روزانه و یادداشت",
      description: "وظایف روزانه، یادداشت‌های سریع و اولویت‌بندی.",
      tags: ["تسک", "نوت"],
      accent: "teal",
      span: "sm",
    },
    {
      id: "projects",
      title: "پروژه و زمان فریلنسری",
      description: "مدیریت پروژه، ثبت ساعت کار و گزارش حضور فریلنسری.",
      tags: ["پروژه", "تایم‌لاین"],
      accent: "violet",
      span: "md",
    },
    {
      id: "ventures",
      title: "مشارکت و سرمایه‌گذاری",
      description: "ثبت سرمایه‌گذاری مشترک، تسویه شریک و دعوت همکار.",
      tags: ["شریک", "سرمایه"],
      accent: "rose",
      span: "sm",
    },
    {
      id: "voice",
      title: "دستیار صوتی و تلگرام",
      description: "ثبت تراکنش با صدا و اعلان تلگرام برای درخواست‌ها.",
      tags: ["صدا", "بات"],
      accent: "teal",
      span: "sm",
    },
  ],
  business: {
    eyebrow: "فضای کسب‌وکار",
    title: "حضور GPS",
    highlight: "مثل فینتو — روی وب",
    description:
      "Geofence، شیفت چرخشی، مرخصی چندروزه، گزارش اکسل، جمعه و تعطیلات رسمی.",
    bullets: [
      "ورود/خروج با موقعیت مرورگر",
      "گزارش ماهانه + ویرایش تردد",
      "RBAC و تنخواه تیمی",
    ],
    features: [
      {
        title: "حضور و غیاب GPS",
        description: "ورود و خروج با موقعیت مرورگر، Geofence و دورکاری.",
      },
      {
        title: "شیفت و پرسنل",
        description: "شیفت ثابت، ساعتی و چرخشی با تخصیص به پرسنل.",
      },
      {
        title: "گزارش و اکسل",
        description: "گزارش ماهانه تیم، تعطیلات رسمی و خروجی اکسل.",
      },
      {
        title: "مالی و تنخواه",
        description: "تراکنش کسب‌وکار، سقف تأیید و نقش‌های دسترسی.",
      },
    ],
  },
  whyUs: [
    {
      title: "همه‌چیز در یک میز",
      description: "به‌جای چند اپ جدا — میز پردیس یک اکوسیستم یکپارچه است.",
    },
    {
      title: "ساخته‌شده برای ایران",
      description: "تقویم جلالی، تعطیلات رسمی و بانک‌های داخلی.",
    },
    {
      title: "حضور حرفه‌ای تیمی",
      description: "GPS، شیفت، اکسل و اعلان تلگرام.",
    },
    {
      title: "امنیت و دسترسی",
      description: "نقش‌های دقیق و لاگ ممیزی برای مدیران.",
    },
    {
      title: "وب + PWA",
      description: "نصب روی موبایل از مرورگر — اپ اندروید به‌زودی.",
    },
    {
      title: "رایگان شروع کنید",
      description: "ورود با موبایل — بدون پیچیدگی.",
    },
  ],
  howSteps: [
    { step: "۱", title: "ثبت‌نام با موبایل", description: "شماره موبایل خود را وارد کنید." },
    { step: "۲", title: "تنظیم مالی", description: "صندوق‌ها و اولین تراکنش‌ها." },
    { step: "۳", title: "کسب‌وکار بسازید", description: "پرسنل، شیفت و Geofence." },
    { step: "۴", title: "مدیریت روزانه", description: "حضور، مالی و گزارش." },
  ],
  faq: [
    {
      q: "GPS حضور کجا کار می‌کند؟",
      a: "در نسخه وب، مرورگر موقعیت را می‌فرستد و Geofence بررسی می‌شود.",
    },
    {
      q: "آیا مثل فینتو حضور دارد؟",
      a: "بله — شیفت، مرخصی، گزارش ماهانه و اکسل.",
    },
    {
      q: "اپ اندروید دارید؟",
      a: "نسخه وب و PWA آماده است؛ اپ اندروید به‌زودی منتشر می‌شود.",
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
      "میز پردیس حاصل نیاز واقعی کاربران ایرانی است: مالی شخصی و حضور تیمی در یک ابزار بومی.",
      "هر هفته بر اساس بازخورد شما بهتر می‌شویم.",
    ],
  },
  marquee: [
    "مدیریت مالی",
    "حضور GPS",
    "تقویم شمسی",
    "گزارش اکسل",
    "بات تلگرام",
    "دستیار صوتی",
  ],
  settings: {
    downloadComingSoon: true,
    downloadLabel: "به‌زودی",
    showAppDownloadInNav: true,
  },
  pricing: {
    eyebrow: "قیمت‌گذاری شفاف",
    title: "پلنی که با شما رشد می‌کند",
    description:
      "شروع رایگان برای مدیریت مالی شخصی. برای تیم‌ها و حضور GPS، پلن کسب‌وکار را انتخاب کنید.",
    plans: [
      {
        id: "personal",
        name: "شخصی",
        price: "رایگان",
        period: "همیشه",
        description: "میز مالی شخصی، بودجه، پروژه و برنامه روزانه",
        features: [
          "تراکنش و دسته‌بندی نامحدود",
          "داشبورد و تحلیل مالی",
          "پروژه و تسک روزانه",
          "PWA و دسترسی وب",
        ],
        cta: "شروع رایگان",
        highlighted: false,
      },
      {
        id: "business",
        name: "کسب‌وکار",
        price: "تماس",
        period: "ماهانه",
        description: "حضور GPS، پرسنل، مالی تیمی و گزارش اکسل",
        features: [
          "حضور و غیاب با Geofence",
          "مدیریت پرسنل و نقش‌ها",
          "صندوق خرد و مالی تیمی",
          "گزارش و خروجی اکسل",
          "پشتیبانی تلگرام",
        ],
        cta: "درخواست دمو",
        highlighted: true,
      },
      {
        id: "enterprise",
        name: "سازمانی",
        price: "سفارشی",
        period: "قراردادی",
        description: "چند شعبه، سفارشی‌سازی و پشتیبانی اختصاصی",
        features: [
          "چند کسب‌وکار و شعبه",
          "آموزش تیم",
          "اولویت پشتیبانی",
          "یکپارچه‌سازی اختصاصی",
        ],
        cta: "تماس با فروش",
        highlighted: false,
      },
    ],
  },
  seo: {
    title: "میز پردیس — مدیریت مالی، پروژه و برنامه روزانه",
    description:
      "میز کار شخصی برای مدیریت مالی، حضور GPS تیمی، پروژه و تقویم شمسی.",
    ogImageUrl: "/assets/logo-mark.svg",
  },
};

/** @deprecated use DEFAULT_LANDING_CONTENT */
export const LANDING_NAV = DEFAULT_LANDING_CONTENT.nav;
export const LANDING_STATS = DEFAULT_LANDING_CONTENT.stats;
export const LANDING_FEATURES = DEFAULT_LANDING_CONTENT.features;
export const BUSINESS_FEATURES = DEFAULT_LANDING_CONTENT.business.features;
export const WHY_US = DEFAULT_LANDING_CONTENT.whyUs;
export const HOW_STEPS = DEFAULT_LANDING_CONTENT.howSteps;
export const FAQ_ITEMS = DEFAULT_LANDING_CONTENT.faq;
export const CONTACT = DEFAULT_LANDING_CONTENT.contact;
