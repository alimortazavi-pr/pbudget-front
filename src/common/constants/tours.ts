import { PATHS } from "@/common/constants";

export type TourStep = {
  /** CSS selector — first visible match wins (fixes hidden sidebar duplicates) */
  target?: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "start" | "end" | "center";
  /** Skip step if target missing (e.g. voice FAB when disabled) */
  optional?: boolean;
  /** Limit step to viewport type */
  when?: "mobile" | "desktop" | "all";
};

export type TourDefinition = {
  id: string;
  name: string;
  steps: TourStep[];
};

export const ONBOARDING_TOUR: TourDefinition = {
  id: "onboarding",
  name: "راهنمای شروع",
  steps: [
    {
      title: "به Paradise Budget خوش آمدید",
      description:
        "در چند قدم کوتاه با مهم‌ترین بخش‌های اپ آشنا می‌شوید. هر وقت خواستید دوباره از دکمه راهنما در بالای صفحه شروع کنید.",
      placement: "center",
    },
    {
      target: '[data-tour="nav-create"]',
      title: "ثبت تراکنش",
      description:
        "با دکمه + وسط نوار پایین، سریع درآمد یا هزینه ثبت کنید. پرکاربردترین میانبر اپ همینجاست.",
      placement: "top",
      when: "mobile",
    },
    {
      target: '[data-tour="nav-tab-bar"]',
      title: "ناوبری پایین",
      description:
        "خانه، برنامه روزانه، یادداشت‌ها و منوی «بیشتر» — همه از این نوار در دسترس‌اند.",
      placement: "top",
      when: "mobile",
    },
    {
      target: '[data-tour="nav-more"]',
      title: "منوی بیشتر",
      description:
        "پروژه‌ها، بدهی‌ها، اقساط، چک‌ها، کسب‌وکار و تنظیمات حساب — همه از این منو.",
      placement: "top",
      when: "mobile",
    },
    {
      target: '[data-tour="nav-create"]',
      title: "ثبت تراکنش",
      description: "از این دکمه در منوی کناری سریع درآمد یا هزینه ثبت کنید.",
      placement: "end",
      when: "desktop",
    },
    {
      target: '[data-tour="sidebar"]',
      title: "منوی کناری",
      description:
        "دسترسی به داشبورد، تحلیل مالی، صندوق‌ها، کارت‌ها، دسته‌بندی‌ها و بخش‌های برنامه‌ریزی.",
      placement: "end",
      when: "desktop",
    },
    {
      target: '[data-tour="voice-fab"]',
      title: "دستیار صوتی",
      description:
        "با میکروفون شناور، تراکنش، تسک، یادداشت، بدهی و بیشتر را با صدا ثبت کنید — در همه صفحات فعال است.",
      placement: "top",
      optional: true,
    },
    {
      target: '[data-tour="tour-button"]',
      title: "راهنمای هر صفحه",
      description:
        "هر وقت خواستید دوباره راهنما ببینید این دکمه را بزنید. در هر صفحه راهنمای اختصاصی همان بخش نمایش داده می‌شود.",
      placement: "bottom",
    },
  ],
};

export const PAGE_TOURS: Record<string, TourDefinition> = {
  [PATHS.HOME]: {
    id: "page-home",
    name: "راهنمای داشبورد",
    steps: [
      {
        target: '[data-tour="dashboard-balance"]',
        title: "موجودی و خلاصه دوره",
        description:
          "موجودی فعلی کیف پول به‌همراه دریافتی و پرداختی همین بازه — همیشه بالای داشبورد در دسترس است.",
        placement: "bottom",
      },
      {
        target: '[data-tour="dashboard-period"]',
        title: "بازه زمانی",
        description:
          "بین نمای روزانه و ماهانه جابه‌جا شوید و با فلش‌ها روز یا ماه قبل/بعد را ببینید.",
        placement: "bottom",
      },
      {
        target: '[data-tour="dashboard-filter"]',
        title: "فیلتر تراکنش‌ها",
        description: "بر اساس دسته‌بندی یا تاریخ دقیق، لیست تراکنش‌ها را محدود کنید.",
        placement: "bottom",
      },
      {
        target: '[data-tour="dashboard-transactions"]',
        title: "لیست تراکنش‌ها",
        description: "روی هر تراکنش بزنید تا ویرایش یا حذف کنید. دکمه خروجی هم گزارش Excel می‌دهد.",
        placement: "top",
        optional: true,
      },
    ],
  },
  [PATHS.ANALYSIS]: {
    id: "page-analysis",
    name: "راهنمای تحلیل",
    steps: [
      {
        target: '[data-tour="analysis-filters"]',
        title: "فیلترهای تحلیل",
        description:
          "بازه (روز/ماه/سال)، دسته، کارت پرداخت و نوع تراکنش را تنظیم کنید. مقایسه دوره‌ای هم از همینجا فعال می‌شود.",
        placement: "bottom",
      },
      {
        target: '[data-tour="analysis-kpi"]',
        title: "شاخص‌های کلیدی",
        description: "خلاصه عددی درآمد، هزینه، پس‌انداز و نسبت‌ها — قبل از نمودارها نگاهی سریع بیندازید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="analysis-charts"]',
        title: "نمودارهای تعاملی",
        description:
          "روند زمانی، توزیع دسته‌ها و بینش‌های عملی — برای تصمیم‌گیری مالی از این بخش استفاده کنید.",
        placement: "top",
        optional: true,
      },
    ],
  },
  [PATHS.TASKS]: {
    id: "page-tasks",
    name: "راهنمای برنامه روزانه",
    steps: [
      {
        target: '[data-tour="tasks-section-tabs"]',
        title: "لیست برنامه و تسک‌های ثابت",
        description: "بین برنامه روزانه/ماهانه و تسک‌های تکراری (routine) جابه‌جا شوید.",
        placement: "bottom",
      },
      {
        target: '[data-tour="tasks-period"]',
        title: "بازه و ناوبری",
        description: "روزانه، ماهانه یا سالانه — با فلش‌ها بین دوره‌ها حرکت کنید.",
        placement: "bottom",
      },
      {
        target: '[data-tour="tasks-quick-add"]',
        title: "افزودن سریع",
        description: "در نمای روزانه، تسک را تایپ و Enter بزنید — بدون باز کردن فرم کامل.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="tasks-list"]',
        title: "مدیریت تسک‌ها",
        description:
          "سوئیچ برای تکمیل، دکمه ویرایش برای جزئیات (اولویت، ساعت، پروژه) و حذف.",
        placement: "top",
        optional: true,
      },
    ],
  },
  [PATHS.SETTINGS]: {
    id: "page-settings",
    name: "راهنمای تنظیمات",
    steps: [
      {
        target: '[data-tour="settings-theme"]',
        title: "تم اپ",
        description: "بین حالت روشن و تاریک جابه‌جا شوید — روی همه صفحات اعمال می‌شود.",
        placement: "bottom",
      },
      {
        target: '[data-tour="settings-voice"]',
        title: "دستیار صوتی",
        description: "فعال/غیرفعال کردن دکمه میکروفون شناور در تمام صفحات.",
        placement: "bottom",
      },
      {
        target: '[data-tour="settings-telegram"]',
        title: "اتصال تلگرام",
        description: "حساب تلگرام را وصل کنید تا اعلان‌ها و دستورات بات در دسترس باشد.",
        placement: "bottom",
      },
      {
        target: '[data-tour="settings-support"]',
        title: "پشتیبانی و نسخه",
        description: "تماس با پشتیبانی، مشاهده تغییرات نسخه و بروزرسانی اپ.",
        placement: "top",
      },
    ],
  },
  [PATHS.BANK_IMPORT]: {
    id: "page-bank-import",
    name: "راهنمای ورود از بانک",
    steps: [
      {
        title: "ورود از صورتحساب بانک",
        description:
          "فایل Excel یا CSV بانک را آپلود کنید؛ تراکنش‌ها خودکار شناسایی و برای تأیید نمایش داده می‌شوند.",
        placement: "center",
      },
      {
        target: '[data-tour="page-content"]',
        title: "مراحل واردسازی",
        description: "بانک را انتخاب کنید، فایل را بکشید و پس از بررسی، تراکنش‌های تأییدشده را ثبت کنید.",
        placement: "center",
      },
    ],
  },
  [PATHS.BOXES]: {
    id: "page-boxes",
    name: "راهنمای صندوق‌ها",
    steps: [
      {
        target: '[data-tour="page-content"]',
        title: "صندوق‌های پس‌انداز",
        description:
          "برای اهداف مختلف (مسافرت، اضطراری و…) صندوق بسازید و موجودی هر کدام را جدا پیگیری کنید.",
        placement: "center",
      },
    ],
  },
  [PATHS.DEBTS]: {
    id: "page-debts",
    name: "راهنمای طلب و بدهی",
    steps: [
      {
        target: '[data-tour="page-content"]',
        title: "طلب و بدهی",
        description: "بدهی‌ها و طلب‌های خود را ثبت کنید، تسویه جزئی انجام دهید و مانده را ببینید.",
        placement: "center",
      },
    ],
  },
  [PATHS.PROJECTS]: {
    id: "page-projects",
    name: "راهنمای پروژه‌ها",
    steps: [
      {
        target: '[data-tour="page-content"]',
        title: "مدیریت پروژه",
        description:
          "پروژه بسازید، هزینه/درآمد پروژه‌ای ثبت کنید، تسک‌ها را لینک دهید و حضور و غیاب را پیگیری کنید.",
        placement: "center",
      },
    ],
  },
};

export const PERSONA_TOURS: Record<string, TourDefinition> = {
  personal: ONBOARDING_TOUR,
  business: {
    id: "persona-business",
    name: "راهنمای کسب‌وکار",
    steps: [
      {
        title: "به فضای کسب‌وکار خوش آمدید",
        description:
          "از اینجا پرسنل، حضور، مالی تیمی و گزارش‌ها را مدیریت می‌کنید.",
        placement: "center",
      },
      {
        target: '[data-tour="page-content"]',
        title: "داشبورد کسب‌وکار",
        description:
          "خلاصه وضعیت تیم، تراکنش‌های اخیر و میانبرهای مهم همین‌جاست.",
        placement: "center",
        optional: true,
      },
      {
        target: '[data-tour="tour-button"]',
        title: "راهنمای صفحات",
        description: "در هر بخش می‌توانید دوباره راهنما را ببینید.",
        placement: "bottom",
        optional: true,
      },
    ],
  },
  attendance: {
    id: "persona-attendance",
    name: "راهنمای حضور پرسنل",
    steps: [
      {
        title: "پرتال حضور شما",
        description:
          "ورود و خروج با GPS، درخواست مرخصی و گزارش ماهانه — همه از همین صفحه.",
        placement: "center",
      },
      {
        target: '[data-tour="attendance-tabs"]',
        title: "تب‌های اصلی",
        description: "بین ثبت حضور، درخواست‌ها و گزارش جابه‌جا شوید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="attendance-clock"]',
        title: "ثبت ورود و خروج",
        description:
          "موقعیت GPS را فعال کنید و دکمه ورود/خروج را بزنید. در محدوده مجاز باید باشید.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="attendance-push"]',
        title: 'یادآور ورود',
        description:
          'اعلان وب را فعال کنید تا اگر ورود امروز را ثبت نکرده باشید، صبح یادآوری بگیرید.',
        placement: 'top',
        optional: true,
      },
      {
        target: '[data-tour="attendance-pwa"]',
        title: "نصب روی گوشی",
        description:
          "اپ را نصب کنید تا مثل برنامه native از صفحه اصلی باز کنید — ایده‌آل برای پرسنل.",
        placement: "top",
        optional: true,
      },
    ],
  },
  admin: {
    id: "persona-admin",
    name: "راهنمای پنل ادمین",
    steps: [
      {
        title: "پنل مدیریت سیستم",
        description:
          "کاربران، محتوا، لندینگ، بکاپ و لاگ‌ها — دسترسی کامل مدیر سیستم.",
        placement: "center",
      },
      {
        target: '[data-tour="page-content"]',
        title: "داشبورد ادمین",
        description: "وضعیت سلامت، فعالیت کاربران و میانبرهای مدیریتی.",
        placement: "center",
        optional: true,
      },
    ],
  },
  invites: {
    id: "persona-invites",
    name: "راهنمای دعوت‌ها",
    steps: [
      {
        title: "صندوق دعوت‌ها",
        description:
          "دعوت‌های کسب‌وکار و همکاری پروژه اینجا جمع می‌شوند — بپذیرید یا رد کنید.",
        placement: "center",
      },
      {
        target: '[data-tour="invites-list"]',
        title: "کارت‌های دعوت",
        description:
          "جزئیات نقش، تاریخ انقضا و لینک مستقیم — پذیرش فوری یا مشاهده جزئیات.",
        placement: "top",
        optional: true,
      },
    ],
  },
};

export function getPersonaTour(kind: string): TourDefinition | null {
  return PERSONA_TOURS[kind] ?? null;
}

export function getTourForPath(pathname: string): TourDefinition | null {
  if (PAGE_TOURS[pathname]) return PAGE_TOURS[pathname];

  for (const [path, tour] of Object.entries(PAGE_TOURS)) {
    if (path !== PATHS.HOME && pathname.startsWith(path)) return tour;
  }

  return null;
}
