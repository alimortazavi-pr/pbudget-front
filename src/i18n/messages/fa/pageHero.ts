import type { MessageTree } from "../../types";

export const pageHeroMessages: MessageTree = {
  shared: {
    backToProject: "بازگشت به پروژه",
    allProjectsLink: "همه پروژه‌ها",
    enableTimeTrackingHint:
      "از تنظیمات پروژه می‌توانید «ثبت ساعت کاری» را فعال کنید.",
  },
  notes: {
    eyebrow: "یادداشت مالی",
    description:
      "متن آزاد و چک‌لیست در یک صفحه، با دسته‌بندی جدا از تراکنش.",
    durationGeneral: "کلی",
  },
  tasks: {
    eyebrow: "برنامه‌ریزی و پیگیری",
    description:
      "برنامه روزانه، ماهانه و سالانه — همه با تاریخ شمسی و لینک به پروژه‌ها",
  },
  workAttendance: {
    eyebrow: "پروژه‌ها",
    title: "حضور و غیاب",
    description:
      "ساعت روزانه را برای هر پروژه تعریف کنید — هدف ماه با احتساب جمعه و تعطیلات رسمی محاسبه می‌شود.",
    tabToday: "امروز",
    tabAllProjects: "همه پروژه‌ها",
    todayProjectsTitle: "پروژه‌های امروز",
    allProjectsTitle: "پروژه‌ها",
    noActiveProjectsToday:
      "امروز روز کاری نیست یا پروژه فعالی ندارید.",
    todayWorked: "امروز: {{duration}}",
    todayWorkedInline: " · امروز {{duration}}",
    dailyHoursSum: "جمع ساعت روزانه پروژه‌ها:",
    setDailyHoursHint: "برای هر پروژه «ساعت روزانه» را در جزئیات تنظیم کنید.",
    dailyHoursNotSet: "ساعت روزانه تعریف نشده — از جزئیات تنظیم کنید",
  },
  projects: {
    eyebrow: "مدیریت پروژه‌ها",
    description:
      "مبلغ کل قرارداد، پرداخت‌های خرد و یادداشت‌های جلسه را در یک جا ببینید.",
  },
  projectAttendance: {
    eyebrow: "حضور و غیاب پروژه",
    description: "ورود و خروج، ثبت دستی ساعات و تحلیل کارکرد این پروژه",
    disabledDescription: "این پروژه نیاز به ثبت ساعت کاری ندارد.",
  },
  installments: {
    eyebrow: "برنامه‌ریزی مالی",
    description:
      "برنامه پرداخت بسازید؛ اقساط، پرداخت‌ها و تراکنش‌ها را در صفحه هر برنامه ببینید.",
  },
  checks: {
    eyebrow: "مدیریت چک",
    description:
      "ثبت چک دریافتی و پرداختی با سررسید و وصول خودکار به تراکنش.",
    recordButton: "ثبت چک",
  },
  commitments: {
    eyebrow: "تعهدات ناپایدار",
    description:
      "مبالغی که مدام کم و زیاد می‌شوند — صدقه، انعام، یا هر بدهی کوچک که هنوز ثبت نهایی نشده.",
  },
  debts: {
    eyebrow: "مدیریت تعهدات مالی",
    description:
      "هر طلب یا بدهی را باز کنید؛ تسویه‌ها، تراکنش‌ها و تحلیل را در یک صفحه ببینید.",
  },
  analysis: {
    eyebrow: "مرکز تحلیل مالی",
    title: "تحلیل جامع وضعیت مالی",
    description:
      "نمودارهای تعاملی درآمد و هزینه، توزیع دسته‌بندی‌ها، روند زمانی و بینش‌های عملی برای تصمیم‌گیری بهتر.",
    loading: "در حال آماده‌سازی تحلیل و نمودارها…",
    noData: "داده‌ای برای نمایش نمودار موجود نیست.",
  },
  ventures: {
    eyebrow: "همکاری و شراکت",
    title: "کسب‌وکارها و شرکا",
    description:
      "برای مشارکت‌هایی که فقط پروژه نیستند — رستوران، فروشگاه، سرمایه‌گذاری مشترک و هر کسب‌وکار دیگر.",
    newButton: "کسب‌وکار جدید",
  },
  invites: {
    title: "دعوت‌های همکاری",
    description: "دعوت‌های همکاری پروژه — بپذیرید یا رد کنید",
    pendingCount: "{{count}} دعوت در انتظار",
  },
};
