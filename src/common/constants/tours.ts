import { PATHS } from "@/common/constants";

export type TourStep = {
  /** CSS selector or data-tour attribute value */
  target: string;
  title: string;
  description: string;
  /** Position of tooltip relative to target */
  placement?: "top" | "bottom" | "start" | "end" | "center";
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
      target: '[data-tour="nav-create"]',
      title: "ثبت تراکنش",
      description:
        "با این دکمه سریع درآمد یا هزینه ثبت کنید. در موبایل دکمه + وسط نوار پایین است.",
      placement: "top",
    },
    {
      target: '[data-tour="voice-fab"]',
      title: "دستیار صوتی",
      description:
        "با میکروفون تراکنش، تسک، یادداشت، بدهی و بیشتر را با صدا ثبت کنید — در همه صفحات فعال است.",
      placement: "top",
    },
    {
      target: '[data-tour="tour-button"]',
      title: "راهنما",
      description:
        "هر وقت خواستید دوباره راهنما ببینید، این دکمه را بزنید. برای هر صفحه هم راهنمای جداگانه دارد.",
      placement: "bottom",
    },
    {
      target: '[data-tour="sidebar"]',
      title: "منوی کناری (دسکتاپ)",
      description:
        "در دسکتاپ از اینجا به همه بخش‌ها دسترسی دارید — مالی، برنامه‌ریزی، کسب‌وکار و تنظیمات.",
      placement: "end",
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
        title: "موجودی",
        description: "موجودی فعلی کیف پول و خلاصه درآمد/هزینه دوره.",
        placement: "bottom",
      },
      {
        target: '[data-tour="dashboard-transactions"]',
        title: "تراکنش‌ها",
        description: "لیست تراکنش‌های دوره — برای ویرایش روی هر کدام بزنید.",
        placement: "top",
      },
    ],
  },
  [PATHS.ANALYSIS]: {
    id: "page-analysis",
    name: "راهنمای تحلیل",
    steps: [
      {
        target: '[data-tour="page-content"]',
        title: "تحلیل مالی",
        description: "نمودارها و KPIهای مالی — دوره را از بالای صفحه تغییر دهید.",
        placement: "center",
      },
    ],
  },
  [PATHS.TASKS]: {
    id: "page-tasks",
    name: "راهنمای برنامه روزانه",
    steps: [
      {
        target: '[data-tour="page-content"]',
        title: "برنامه روزانه",
        description: "تسک‌های روزانه را اضافه، تکمیل یا حذف کنید.",
        placement: "center",
      },
    ],
  },
  [PATHS.SETTINGS]: {
    id: "page-settings",
    name: "راهنمای تنظیمات",
    steps: [
      {
        target: '[data-tour="page-content"]',
        title: "تنظیمات",
        description: "تم، دستیار صوتی، تلگرام و پشتیبانی — همه از اینجا.",
        placement: "center",
      },
    ],
  },
};

export function getTourForPath(pathname: string): TourDefinition | null {
  if (PAGE_TOURS[pathname]) return PAGE_TOURS[pathname];

  for (const [path, tour] of Object.entries(PAGE_TOURS)) {
    if (path !== PATHS.HOME && pathname.startsWith(path)) return tour;
  }

  return null;
}
