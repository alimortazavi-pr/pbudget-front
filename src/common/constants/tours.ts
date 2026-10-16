import { PATHS } from "@/common/constants";

export type TourStep = {
  /** CSS selector — first visible match wins (fixes hidden sidebar duplicates) */
  target?: string;
  title: string;
  description: string;
  placement?: "top" | "bottom" | "start" | "end" | "center";
  /** Skip step if target is not present on the current page */
  optional?: boolean;
  /** Show the step centred (no spotlight) when its target is not on the page */
  centerIfMissing?: boolean;
  /** Limit step to viewport type */
  when?: "mobile" | "desktop" | "all";
};

export type TourDefinition = {
  id: string;
  name: string;
  steps: TourStep[];
};

/** Page title area: gradient hero on most pages, plain header on the rest. */
const PAGE_TOP = '[data-tour="page-hero"], [data-tour="page-header"]';
const DETAIL_TOP = '[data-tour="detail-header"]';

/** Closing step that points at the next page in the sidebar (centred on mobile). */
function nextPageStep(href: string, description: string): TourStep {
  return {
    target: `[data-tour="nav-${href.replace(/\//g, "")}"]`,
    title: "قدم بعدی",
    description,
    placement: "end",
    centerIfMissing: true,
  };
}

const DASHBOARD_STEPS: TourStep[] = [
  {
    target: '[data-tour="dashboard-balance"]',
    title: "موجودی و خلاصه دوره",
    description:
      "موجودی کیف پول و دریافتی و پرداختی همین بازه، همیشه بالای داشبورد است.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="dashboard-period"]',
    title: "بازه زمانی",
    description:
      "روزانه، ماهانه، سالانه یا کل زمان را انتخاب کنید و با فلش‌ها بین دوره‌ها بروید.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="dashboard-filter"]',
    title: "جستجو و فیلتر",
    description: "تراکنش‌ها را با متن، دسته، کارت، مبلغ یا تاریخ دقیق پیدا کنید.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="dashboard-export"]',
    title: "خروجی گرفتن",
    description: "از تراکنش‌های همین بازه فایل Excel بگیرید.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="dashboard-kpis"]',
    title: "شاخص‌های دوره",
    description: "درآمد، هزینه و تغییرشان نسبت به دوره قبل را یک‌جا ببینید.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="dashboard-transactions"]',
    title: "لیست تراکنش‌ها",
    description: "روی هر تراکنش بزنید تا ویرایش یا حذفش کنید.",
    placement: "top",
    optional: true,
  },
  {
    target: '[data-tour="dashboard-insights"]',
    title: "بینش‌های سریع",
    description: "پرخرج‌ترین دسته‌ها و روزهای پرهزینه، بدون رفتن به صفحه تحلیل.",
    placement: "start",
    optional: true,
  },
];

export const ONBOARDING_TOUR: TourDefinition = {
  id: "onboarding",
  name: "راهنمای شروع",
  steps: [
    {
      title: "به میز پردیس خوش آمدید",
      description:
        "در چند قدم کوتاه با بخش‌های اصلی اپ آشنا می‌شوید. هر وقت خواستید، دکمه راهنما در بالای صفحه همین راهنما را دوباره نشان می‌دهد.",
      placement: "center",
    },
    {
      target: '[data-tour="nav-create"]',
      title: "ثبت تراکنش",
      description:
        "با دکمه + وسط نوار پایین، سریع درآمد یا هزینه ثبت کنید. پرکاربردترین دکمه اپ همین است.",
      placement: "top",
      when: "mobile",
    },
    {
      target: '[data-tour="nav-create"]',
      title: "ثبت تراکنش",
      description: "از این دکمه سریع درآمد یا هزینه ثبت کنید. پرکاربردترین دکمه اپ همین است.",
      placement: "end",
      when: "desktop",
    },
    ...DASHBOARD_STEPS,
    {
      target: '[data-tour="nav-tab-bar"]',
      title: "نوار پایین",
      description:
        "خانه، برنامه روزانه و یادداشت‌ها همیشه از این نوار در دسترس‌اند.",
      placement: "top",
      when: "mobile",
    },
    {
      target: '[data-tour="nav-more"]',
      title: "منوی بیشتر",
      description:
        "پروژه‌ها، طلب و بدهی، اقساط، چک‌ها، شرکا، پروفایل، تنظیمات و پشتیبانی همه در این منو هستند.",
      placement: "top",
      when: "mobile",
    },
    {
      target: '[data-tour="nav-primary"]',
      title: "بخش‌های اصلی",
      description:
        "داشبورد، تحلیل مالی، دستیار هوشمند، صندوق‌ها، کارت‌ها و دسته‌بندی‌ها.",
      placement: "end",
      when: "desktop",
    },
    {
      target: '[data-tour="nav-bank-import-cta"]',
      title: "ورود از صورتحساب بانک",
      description: "فایل Excel بانک را بدهید تا ده‌ها تراکنش یک‌جا ثبت شود.",
      placement: "end",
      when: "desktop",
      optional: true,
    },
    {
      target: '[data-tour="nav-group-planning"]',
      title: "برنامه‌ریزی",
      description:
        "برنامه روزانه، پروژه‌ها، یادداشت‌ها، خروجی سفارشی و پلن‌های اشتراک.",
      placement: "end",
      when: "desktop",
      optional: true,
    },
    {
      target: '[data-tour="nav-group-advancedFinance"]',
      title: "مالی پیشرفته",
      description: "طلب و بدهی، اقساط، چک‌ها و حساب‌های دفتری (نسیه) را جدا پیگیری کنید.",
      placement: "end",
      when: "desktop",
      optional: true,
    },
    {
      target: '[data-tour="nav-group-partnership"]',
      title: "شراکت و ساعت کار",
      description: "کسب‌وکار مشترک با شرکا و ثبت ورود و خروج کاری پروژه‌ها.",
      placement: "end",
      when: "desktop",
      optional: true,
    },
    {
      target: '[data-tour="command-palette"]',
      title: "جستجو و میانبرها",
      description:
        "هر صفحه یا کاری را با جستجو پیدا کنید. روی کامپیوتر Ctrl+K هم کار می‌کند.",
      placement: "bottom",
    },
    {
      target: '[data-tour="account-switcher"]',
      title: "تعویض حساب",
      description: "بین حساب‌های واردشده جابه‌جا شوید یا حساب تازه‌ای اضافه کنید.",
      placement: "bottom",
      optional: true,
    },
    {
      target: '[data-tour="theme-toggle"]',
      title: "حالت روشن و تاریک",
      description: "ظاهر اپ را با یک ضربه روشن یا تاریک کنید.",
      placement: "bottom",
      optional: true,
    },
    {
      target: '[data-tour="sidebar-account"]',
      title: "حساب کاربری",
      description:
        "موجودی کیف پول، پروفایل، تنظیمات، ربات تلگرام و خروج از حساب اینجاست.",
      placement: "end",
      when: "desktop",
      optional: true,
    },
    {
      target: '[data-tour="support-link"]',
      title: "پشتیبانی",
      description: "سؤال یا مشکلی دارید؟ از اینجا تیکت بفرستید و پاسخ را همین‌جا بگیرید.",
      placement: "end",
      when: "desktop",
      optional: true,
    },
    {
      target: '[data-tour="tour-button"]',
      title: "راهنمای هر صفحه",
      description:
        "در هر صفحه این دکمه را بزنید تا راهنمای همان بخش را ببینید. در داشبورد هم همین راهنمای کلی دوباره پخش می‌شود.",
      placement: "bottom",
    },
  ],
};

const BUDGET_FORM_STEPS: TourStep[] = [
  {
    target: '[data-tour="budget-type"]',
    title: "درآمد یا هزینه",
    description: "اول نوع تراکنش را انتخاب کنید.",
    placement: "bottom",
    centerIfMissing: true,
  },
  {
    target: '[data-tour="budget-currency"]',
    title: "واحد پول",
    description: "ریال، دلار یا واحد دیگر؛ موجودی هر واحد جدا حساب می‌شود.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="budget-amount"]',
    title: "مبلغ",
    description: "مبلغ را وارد کنید؛ جداکننده هزارگان خودکار اضافه می‌شود.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="budget-category"]',
    title: "دسته‌بندی",
    description: "دسته را جستجو و انتخاب کنید تا گزارش‌ها و سقف ماهانه دقیق شوند.",
    placement: "bottom",
    optional: true,
  },
  {
    target: '[data-tour="budget-more"]',
    title: "گزینه‌های بیشتر",
    description:
      "کارت پرداخت را انتخاب کنید یا تراکنش را به بدهی، قسط، پروژه یا کسب‌وکار وصل کنید.",
    placement: "top",
    optional: true,
  },
  {
    target: '[data-tour="budget-new-category"]',
    title: "دسته تازه",
    description: "دسته مورد نظر نیست؟ بدون ترک فرم یکی بسازید.",
    placement: "top",
    optional: true,
  },
  {
    target: '[data-tour="budget-submit"]',
    title: "ثبت",
    description: "تراکنش را ذخیره کنید؛ موجودی کیف پول خودکار به‌روز می‌شود.",
    placement: "top",
    optional: true,
  },
];

/** The dashboard (PATHS.HOME) has no entry: its help button replays ONBOARDING_TOUR, which includes the dashboard steps. */
export const PAGE_TOURS: Record<string, TourDefinition> = {
  [PATHS.CREATE_BUDGET]: {
    id: "page-create-budget",
    name: "راهنمای ثبت تراکنش",
    steps: [
      {
        title: "ثبت تراکنش",
        description: "هر درآمد یا هزینه را در چند ثانیه ثبت کنید.",
        placement: "center",
      },
      {
        target: '[data-tour="budget-bank-import"]',
        title: "ثبت گروهی",
        description: "چند تراکنش دارید؟ از صورتحساب بانک یک‌جا واردشان کنید.",
        placement: "bottom",
        optional: true,
      },
      ...BUDGET_FORM_STEPS,
    ],
  },
  "/budgets": {
    id: "page-edit-budget",
    name: "راهنمای ویرایش تراکنش",
    steps: [
      {
        title: "ویرایش تراکنش",
        description: "مبلغ، تاریخ، دسته یا اتصال‌های این تراکنش را تغییر دهید و ذخیره کنید.",
        placement: "center",
      },
      ...BUDGET_FORM_STEPS,
    ],
  },
  [PATHS.ANALYSIS]: {
    id: "page-analysis",
    name: "راهنمای تحلیل",
    steps: [
      {
        target: PAGE_TOP,
        title: "تحلیل مالی",
        description: "ببینید پول از کجا می‌آید و کجا می‌رود.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="analysis-ai"]',
        title: "تحلیل با دستیار هوشمند",
        description: "خلاصه و پیشنهاد آماده از دستیار هوشمند بگیرید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="analysis-filters"]',
        title: "بازه و فیلترها",
        description:
          "بازه را انتخاب کنید و با دکمه فیلتر، دسته، کارت، نوع تراکنش یا مقایسه با دوره قبل را تنظیم کنید.",
        placement: "bottom",
      },
      {
        target: '[data-tour="analysis-kpi"]',
        title: "شاخص‌های کلیدی",
        description: "درآمد، هزینه، پس‌انداز و نسبت‌ها را قبل از نمودارها مرور کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="analysis-tabs"]',
        title: "بخش‌های تحلیل",
        description: "بین نمای کلی، هزینه‌ها، درآمدها، دارایی‌ها و بینش‌ها جابه‌جا شوید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="analysis-charts"]',
        title: "نمودارهای تعاملی",
        description: "روی نمودارها بزنید تا جزئیات هر دسته یا روز را ببینید.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="analysis-features"]',
        title: "خلاصه بخش‌ها",
        description: "وضعیت بدهی، اقساط، چک‌ها و پروژه‌ها در همین بازه.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.AI, "برای پیشنهاد و برنامه شخصی، سری به دستیار هوشمند بزنید."),
    ],
  },
  [PATHS.AI]: {
    id: "page-ai",
    name: "راهنمای دستیار هوشمند",
    steps: [
      {
        target: PAGE_TOP,
        title: "دستیار هوشمند",
        description: "دستیار با داده‌های خودتان، خلاصه و پیشنهاد می‌دهد.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="ai-usage"]',
        title: "سهمیه استفاده",
        description: "تعداد درخواست باقی‌مانده این دوره را اینجا ببینید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="ai-tabs"]',
        title: "بینش، برنامه، گفتگو",
        description:
          "«تحلیل هوشمند» خرج‌ها را بررسی می‌کند، «برنامه ماه بعد» بودجه پیشنهاد می‌دهد و از «دستیار» هر سؤالی بپرسید.",
        placement: "bottom",
        optional: true,
      },
      {
        title: "یک نکته",
        description: "پاسخ‌ها پیشنهادی‌اند؛ تصمیم نهایی مالی با خودتان است.",
        placement: "center",
      },
    ],
  },
  [PATHS.BOXES]: {
    id: "page-boxes",
    name: "راهنمای صندوق‌ها",
    steps: [
      {
        target: PAGE_TOP,
        title: "صندوق‌های پس‌انداز",
        description:
          "برای هر هدف (سفر، اضطراری، خرید بزرگ) صندوق جدا بسازید و پس‌اندازش را ببینید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="boxes-add"]',
        title: "صندوق تازه",
        description: "اسم و در صورت تمایل مبلغ هدف را وارد کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="boxes-list"]',
        title: "صندوق‌های شما",
        description: "موجودی و درصد رسیدن به هدف هر صندوق اینجاست.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="boxes-move"]',
        title: "واریز و برداشت",
        description: "پول را از کیف پول به صندوق ببرید یا برگردانید.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.PAYMENT_CARDS, "کارت‌های بانکی‌تان را هم ثبت کنید تا بدانید هر خرج از کدام کارت بوده."),
    ],
  },
  [PATHS.PAYMENT_CARDS]: {
    id: "page-payment-cards",
    name: "راهنمای کارت‌ها",
    steps: [
      {
        target: PAGE_TOP,
        title: "کارت‌های من",
        description: "کارت‌ها را ثبت کنید تا هنگام ثبت تراکنش، کارت مبدأ یا مقصد را انتخاب کنید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="page-actions"]',
        title: "افزودن کارت",
        description: "نام، بانک، چهار رقم آخر و رنگ کارت کافی است.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="cards-list"]',
        title: "کارت‌های ثبت‌شده",
        description: "هر کارت را ویرایش یا حذف کنید.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="cards-default"]',
        title: "کارت پیش‌فرض",
        description: "با ستاره، کارتی را که بیشتر استفاده می‌کنید پیش‌فرض کنید.",
        placement: "bottom",
        optional: true,
      },
      nextPageStep(PATHS.CATEGORIES, "حالا دسته‌بندی‌ها را مرتب کنید تا گزارش‌ها دقیق‌تر شوند."),
    ],
  },
  [PATHS.CATEGORIES]: {
    id: "page-categories",
    name: "راهنمای دسته‌بندی‌ها",
    steps: [
      {
        target: PAGE_TOP,
        title: "دسته‌بندی‌ها",
        description: "دسته‌ها تراکنش‌ها را مرتب می‌کنند و پایه گزارش‌ها هستند.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="page-actions"]',
        title: "دسته تازه",
        description: "دسته یا زیردسته بسازید، رنگ بدهید و سقف خرج ماهانه تعیین کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="categories-search"]',
        title: "جستجو",
        description: "دسته مورد نظر را سریع پیدا کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="categories-list"]',
        title: "لیست دسته‌ها",
        description: "زیردسته‌ها با تورفتگی نشان داده می‌شوند. دسته‌های پروژه‌ای برچسب جدا دارند.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="nav-create"]',
        title: "قدم بعدی",
        description: "حالا اولین تراکنش را با دسته درست ثبت کنید.",
        placement: "end",
        centerIfMissing: true,
      },
    ],
  },
  [PATHS.BANK_IMPORT]: {
    id: "page-bank-import",
    name: "راهنمای ورود از بانک",
    steps: [
      {
        target: PAGE_TOP,
        title: "ورود از صورتحساب بانک",
        description:
          "فایل Excel یا CSV بانک را بدهید؛ تراکنش‌ها خودکار خوانده و برای تأیید نمایش داده می‌شوند.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="bank-import-steps"]',
        title: "چهار مرحله",
        description: "انتخاب بانک، بارگذاری فایل، بررسی تراکنش‌ها و ثبت نهایی.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="bank-import-draft"]',
        title: "پیش‌نویس ذخیره‌شده",
        description: "کار نیمه‌تمام قبلی را از همان‌جا ادامه دهید یا دور بیندازید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="bank-import-banks"]',
        title: "انتخاب بانک",
        description: "بانکی را که فایل از آن آمده انتخاب کنید و به مرحله بعد بروید.",
        placement: "top",
        optional: true,
      },
      {
        title: "بررسی قبل از ثبت",
        description:
          "در مرحله بررسی، ردیف‌ها را انتخاب و دسته‌شان را کامل کنید؛ ردیف‌های تکراری خودکار کنار می‌روند. تا تأیید نکنید چیزی ثبت نمی‌شود.",
        placement: "center",
      },
    ],
  },
  [PATHS.DEBTS]: {
    id: "page-debts",
    name: "راهنمای طلب و بدهی",
    steps: [
      {
        target: PAGE_TOP,
        title: "طلب و بدهی",
        description: "پول‌هایی را که به کسی داده‌اید یا از کسی گرفته‌اید ثبت و پیگیری کنید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="debts-summary"]',
        title: "خلاصه باز",
        description: "جمع طلب‌ها و بدهی‌های تسویه‌نشده.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="debts-add"]',
        title: "ثبت طلب یا بدهی",
        description: "شخص، مبلغ و در صورت تمایل تاریخ سررسید را وارد کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="debts-filters"]',
        title: "فیلتر وضعیت",
        description: "باز، همه یا تسویه‌شده.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="debts-list"]',
        title: "جزئیات و تسویه",
        description: "روی هر مورد بزنید تا تسویه کامل یا جزئی ثبت کنید.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.INSTALLMENTS, "پرداخت‌های ماهانه منظم را در اقساط ثبت کنید."),
    ],
  },
  [PATHS.INSTALLMENTS]: {
    id: "page-installments",
    name: "راهنمای اقساط",
    steps: [
      {
        target: PAGE_TOP,
        title: "اقساط",
        description: "وام، اجاره یا هر پرداخت ماهانه را برنامه‌ریزی کنید تا سررسیدی جا نماند.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="period-navigator"]',
        title: "ماه",
        description: "اقساط هر ماه را با فلش‌ها ببینید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="installments-month"]',
        title: "وضعیت این ماه",
        description: "مانده و پرداخت‌شده‌های ماه انتخاب‌شده.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="installments-add"]',
        title: "برنامه قسط تازه",
        description: "مبلغ، روز سررسید و تعداد اقساط را تعیین کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="installments-list"]',
        title: "برنامه‌های قسط",
        description: "روی هر برنامه بزنید تا قسط‌ها را پرداخت‌شده علامت بزنید.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.CHECKS, "چک‌های دریافتی و پرداختی را هم در بخش چک‌ها داشته باشید."),
    ],
  },
  [PATHS.CHECKS]: {
    id: "page-checks",
    name: "راهنمای چک‌ها",
    steps: [
      {
        target: PAGE_TOP,
        title: "چک‌ها",
        description: "چک‌های دریافتی و پرداختی و تاریخ سررسیدشان را یک‌جا ببینید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="period-navigator"]',
        title: "ماه سررسید",
        description: "چک‌های هر ماه را با فلش‌ها مرور کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="checks-summary"]',
        title: "در انتظار",
        description: "جمع چک‌های دریافتی و پرداختی پاس‌نشده.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="checks-add"]',
        title: "ثبت چک",
        description: "شخص، مبلغ، بانک و تاریخ سررسید را وارد کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="checks-list"]',
        title: "پاس شدن چک",
        description: "وقتی چک پاس شد، دکمه زیر آن را بزنید تا تراکنشش ثبت شود.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.COMMITMENTS, "حساب‌های نسیه و دفتری را در بخش حساب‌ها نگه دارید."),
    ],
  },
  [PATHS.COMMITMENTS]: {
    id: "page-commitments",
    name: "راهنمای حساب‌های دفتری",
    steps: [
      {
        target: PAGE_TOP,
        title: "حساب‌های دفتری",
        description: "حساب نسیه سوپرمارکت، قهوه‌خانه یا هر حساب جاری را سریع کم و زیاد کنید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="commitments-stats"]',
        title: "خلاصه",
        description: "جمع مانده و تعداد حساب‌های فعال و صفرشده.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="commitments-filters"]',
        title: "فیلتر",
        description: "حساب‌های فعال، همه یا صفرشده را ببینید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="commitments-add"]',
        title: "حساب تازه",
        description: "یک عنوان و مبلغ اولیه کافی است.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="commitments-list"]',
        title: "کم و زیاد سریع",
        description: "با دکمه‌های + و − مبلغ را بدون باز کردن فرم تغییر دهید.",
        placement: "top",
        optional: true,
      },
    ],
  },
  [PATHS.NOTES]: {
    id: "page-notes",
    name: "راهنمای یادداشت‌ها",
    steps: [
      {
        target: PAGE_TOP,
        title: "یادداشت‌ها",
        description: "ایده‌ها، لیست خرید و یادآوری‌ها را کنار امور مالی نگه دارید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="notes-duration"]',
        title: "نوع یادداشت",
        description: "عمومی، سالانه، ماهانه یا روزانه؛ هر دوره یادداشت جدا دارد.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="period-navigator"]',
        title: "دوره",
        description: "با فلش‌ها بین روزها، ماه‌ها یا سال‌ها بروید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="notes-categories"]',
        title: "دسته‌های یادداشت",
        description: "دسته بسازید و یادداشت‌ها را بر اساس آن فیلتر کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="notes-editor"]',
        title: "نوشتن",
        description: "مثل دفترچه بنویسید؛ تغییرات خودکار ذخیره می‌شوند و برای هر خط یادآور بگذارید.",
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
        target: PAGE_TOP,
        title: "برنامه روزانه",
        description: "کارهای روز، ماه و سال را برنامه‌ریزی و تیک بزنید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="tasks-section-tabs"]',
        title: "برنامه و کارهای تکراری",
        description: "بین برنامه زمانی و کارهای تکراری (روتین) جابه‌جا شوید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="tasks-period"]',
        title: "بازه و ناوبری",
        description: "روزانه، ماهانه یا سالانه؛ با فلش‌ها بین دوره‌ها بروید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="tasks-quick-add"]',
        title: "افزودن سریع",
        description: "در نمای روزانه، کار را بنویسید و Enter بزنید.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="tasks-list"]',
        title: "مدیریت کارها",
        description: "با سوئیچ کار را تمام کنید؛ با ویرایش، اولویت، ساعت یا پروژه بدهید.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.PROJECTS, "کارهای بزرگ‌تر را در پروژه‌ها با درآمد و هزینه‌شان دنبال کنید."),
    ],
  },
  [PATHS.PROJECTS]: {
    id: "page-projects",
    name: "راهنمای پروژه‌ها",
    steps: [
      {
        target: PAGE_TOP,
        title: "پروژه‌ها",
        description: "برای هر پروژه مبلغ قرارداد، دریافتی‌ها، هزینه‌ها و ساعت کار را یک‌جا ببینید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="projects-summary"]',
        title: "خلاصه پروژه‌ها",
        description: "جمع قراردادها، دریافتی‌ها و مانده.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="projects-add"]',
        title: "پروژه تازه",
        description: "مبلغ، درآمد ثابت یا ساعتی و پیگیری ساعت کار را تعیین کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="projects-attendance"]',
        title: "ساعت کار",
        description: "ورود و خروج کاری همه پروژه‌ها در یک صفحه.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="projects-list"]',
        title: "جزئیات پروژه",
        description: "روی هر پروژه بزنید تا تراکنش، قسط، کار و شرکای آن را مدیریت کنید.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.VENTURES, "کسب‌وکار مشترک دارید؟ شرکا را در بخش شرکا دعوت کنید."),
    ],
  },
  [PATHS.WORK_ATTENDANCE]: {
    id: "page-work-attendance",
    name: "راهنمای ساعت کار",
    steps: [
      {
        target: PAGE_TOP,
        title: "ساعت کار",
        description: "ورود و خروج کاری را ثبت کنید و پیشرفت ساعت ماهانه را ببینید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="attendance-tabs"]',
        title: "امروز یا همه پروژه‌ها",
        description: "پروژه‌های امروز یا همه پروژه‌های دارای ساعت کار.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="attendance-month"]',
        title: "ماه و خروجی",
        description: "ماه را عوض کنید یا گزارش ساعت کار را دانلود کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="attendance-manual"]',
        title: "ثبت دستی",
        description: "ورود یا خروجی را که جا مانده دستی ثبت کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="attendance-projects"]',
        title: "ورود و خروج",
        description: "برای هر پروژه با یک دکمه شروع یا پایان کار را بزنید.",
        placement: "top",
        optional: true,
      },
    ],
  },
  [PATHS.VENTURES]: {
    id: "page-ventures",
    name: "راهنمای شرکا",
    steps: [
      {
        target: PAGE_TOP,
        title: "کسب‌وکار و شرکا",
        description: "کسب‌وکار مشترک بسازید، شرکا را دعوت کنید و سهم هر نفر را شفاف ببینید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="ventures-add"]',
        title: "کسب‌وکار تازه",
        description: "یک نام و توضیح کوتاه کافی است؛ بعد شرکا را اضافه کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="ventures-list"]',
        title: "کسب‌وکارهای شما",
        description: "روی هر مورد بزنید تا شرکا، تراکنش‌ها و برد کارها را ببینید.",
        placement: "top",
        optional: true,
      },
      {
        title: "دعوت‌ها",
        description: "دعوت‌هایی که دیگران برایتان فرستاده‌اند بالای همین صفحه و در صفحه دعوت‌ها نشان داده می‌شوند.",
        placement: "center",
      },
    ],
  },
  [PATHS.INVITES]: {
    id: "page-invites",
    name: "راهنمای دعوت‌ها",
    steps: [
      {
        target: PAGE_TOP,
        title: "صندوق دعوت‌ها",
        description: "دعوت‌های کسب‌وکار و همکاری پروژه اینجا جمع می‌شوند.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="invites-list"]',
        title: "پذیرش یا رد",
        description: "نقش، تاریخ انقضا و جزئیات هر دعوت را ببینید و پاسخ دهید.",
        placement: "top",
        optional: true,
      },
    ],
  },
  [PATHS.EXPORTS]: {
    id: "page-exports",
    name: "راهنمای خروجی سفارشی",
    steps: [
      {
        target: PAGE_TOP,
        title: "خروجی سفارشی",
        description: "قالب گزارش خودتان را با ستون‌ها، رنگ و لوگوی دلخواه بسازید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="page-actions"]',
        title: "قالب تازه",
        description: "از اینجا یک قالب خالی شروع کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="exports-templates"]',
        title: "قالب‌های ذخیره‌شده",
        description: "هر قالب را برای ویرایش یا گرفتن خروجی انتخاب کنید.",
        placement: "end",
        optional: true,
      },
      {
        target: '[data-tour="exports-tabs"]',
        title: "ستون‌ها، طراحی، پیش‌نمایش",
        description: "ستون‌ها را انتخاب کنید، صفحه را طراحی کنید و قبل از ذخیره پیش‌نمایش ببینید.",
        placement: "bottom",
        optional: true,
      },
    ],
  },
  [PATHS.PLANS]: {
    id: "page-plans",
    name: "راهنمای اشتراک",
    steps: [
      {
        target: PAGE_TOP,
        title: "پلن‌های اشتراک",
        description: "امکانات هر پلن را مقایسه کنید و پلن مناسب را انتخاب کنید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="plans-current"]',
        title: "پلن فعلی",
        description: "پلن فعال و زمان باقی‌مانده آن.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="plans-list"]',
        title: "انتخاب پلن",
        description: "روی پلن مورد نظر بزنید تا درخواست یا خرید ثبت شود.",
        placement: "top",
        optional: true,
      },
    ],
  },
  [PATHS.SUPPORT]: {
    id: "page-support",
    name: "راهنمای پشتیبانی",
    steps: [
      {
        target: PAGE_TOP,
        title: "پشتیبانی",
        description: "سؤال، مشکل یا پیشنهاد خود را با ما در میان بگذارید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        title: "ثبت تیکت",
        description:
          "موضوع و توضیح را بنویسید و بفرستید. پاسخ تیم پشتیبانی در همین صفحه نمایش داده می‌شود.",
        placement: "center",
      },
    ],
  },
  [PATHS.PROFILE]: {
    id: "page-profile",
    name: "راهنمای پروفایل",
    steps: [
      {
        target: '[data-tour="profile-info"]',
        title: "اطلاعات شما",
        description: "نام را ویرایش کنید و شماره موبایل را تغییر دهید یا تأیید کنید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="profile-security"]',
        title: "رمز عبور",
        description: "برای ورود بدون کد پیامکی، رمز عبور بگذارید.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="profile-subscription"]',
        title: "اشتراک",
        description: "پلن فعلی و امکانات فعال را ببینید یا پلن‌ها را مقایسه کنید.",
        placement: "top",
        optional: true,
      },
      nextPageStep(PATHS.SETTINGS, "ظاهر اپ، واحد پول و اتصال ربات‌ها در تنظیمات است."),
    ],
  },
  [PATHS.SETTINGS]: {
    id: "page-settings",
    name: "راهنمای تنظیمات",
    steps: [
      {
        target: '[data-tour="settings-theme"]',
        title: "ظاهر اپ",
        description: "حالت روشن یا تاریک و ظاهر صفحات را انتخاب کنید.",
        placement: "bottom",
        centerIfMissing: true,
      },
      {
        target: '[data-tour="settings-app-mode"]',
        title: "حالت اپ",
        description: "ساده، پیشرفته یا حالت‌های دیگر؛ داده‌هایتان در همه حالت‌ها یکی است.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="settings-preferences"]',
        title: "واحد پول و تقویم",
        description: "واحد پول اصلی، نمایش ریال یا تومان و نوع تقویم را تنظیم کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="settings-telegram"]',
        title: "ربات تلگرام و بله",
        description: "حساب را وصل کنید تا اعلان بگیرید و از داخل ربات تراکنش ثبت کنید.",
        placement: "bottom",
        optional: true,
      },
      {
        target: '[data-tour="settings-support"]',
        title: "پشتیبانی و نسخه",
        description: "تغییرات نسخه را ببینید، اپ را به‌روز کنید یا با پشتیبانی تماس بگیرید.",
        placement: "top",
        optional: true,
      },
      {
        target: '[data-tour="tour-button"]',
        title: "راهنما همیشه در دسترس",
        description: "هر وقت لازم شد، این دکمه راهنمای همان صفحه را نشان می‌دهد.",
        placement: "bottom",
      },
    ],
  },
};

/** Tours for pages with an id in the URL (matched before the prefix fallback). */
const DETAIL_TOURS: { pattern: RegExp; tour: TourDefinition }[] = [
  {
    pattern: /^\/projects\/[^/]+\/attendance$/,
    tour: {
      id: "page-project-attendance",
      name: "راهنمای ساعت کار پروژه",
      steps: [
        {
          target: PAGE_TOP,
          title: "ساعت کار این پروژه",
          description: "ورود و خروج، هدف ماهانه و درآمد ساعتی همین پروژه.",
          placement: "bottom",
          centerIfMissing: true,
        },
        {
          target: '[data-tour="attendance-month"]',
          title: "ماه",
          description: "ساعت کار ماه‌های قبل را با فلش‌ها ببینید.",
          placement: "bottom",
          optional: true,
        },
        {
          target: '[data-tour="attendance-clock"]',
          title: "شروع و پایان کار",
          description: "ورود و خروج را بزنید یا ساعت کار را دستی اضافه کنید.",
          placement: "bottom",
          optional: true,
        },
        {
          target: '[data-tour="attendance-target"]',
          title: "هدف ساعت کار",
          description: "ساعت کار روزانه را تعیین کنید تا پیشرفت ماه محاسبه شود.",
          placement: "top",
          optional: true,
        },
      ],
    },
  },
  {
    pattern: /^\/projects\/[^/]+$/,
    tour: {
      id: "page-project-detail",
      name: "راهنمای مدیریت پروژه",
      steps: [
        {
          target: DETAIL_TOP,
          title: "خلاصه پروژه",
          description: "مبلغ کل، دریافتی، مانده و سود پروژه.",
          placement: "bottom",
          centerIfMissing: true,
        },
        {
          target: '[data-tour="project-links"]',
          title: "ساعت کار و کارها",
          description: "مستقیم به ورود و خروج یا برنامه کارهای همین پروژه بروید.",
          placement: "bottom",
          optional: true,
        },
        {
          target: '[data-tour="detail-tabs"]',
          title: "بخش‌های پروژه",
          description: "تنظیمات، تراکنش‌ها، اقساط، ساعت کار، شرکا، برد کارها و دفترچه پروژه.",
          placement: "bottom",
          optional: true,
        },
      ],
    },
  },
  {
    pattern: /^\/debts\/[^/]+$/,
    tour: {
      id: "page-debt-detail",
      name: "راهنمای جزئیات بدهی",
      steps: [
        {
          target: DETAIL_TOP,
          title: "جزئیات طلب یا بدهی",
          description: "مبلغ، مانده، سررسید و توضیحات این مورد.",
          placement: "bottom",
          centerIfMissing: true,
        },
        {
          target: '[data-tour="debt-settle"]',
          title: "ثبت تسویه",
          description: "تسویه کامل یا بخشی از مبلغ را ثبت کنید.",
          placement: "top",
          optional: true,
        },
        {
          target: '[data-tour="detail-tabs"]',
          title: "تسویه‌ها و تراکنش‌ها",
          description: "تاریخچه تسویه‌ها و تراکنش‌های مرتبط را ببینید.",
          placement: "bottom",
          optional: true,
        },
      ],
    },
  },
  {
    pattern: /^\/installments\/[^/]+$/,
    tour: {
      id: "page-installment-detail",
      name: "راهنمای برنامه قسط",
      steps: [
        {
          target: DETAIL_TOP,
          title: "برنامه قسط",
          description: "مبلغ هر قسط، پرداخت‌شده، مانده و پیشرفت برنامه.",
          placement: "bottom",
          centerIfMissing: true,
        },
        {
          target: '[data-tour="detail-tabs"]',
          title: "قسط‌ها، تراکنش‌ها، تنظیمات",
          description: "قسط‌ها را پرداخت‌شده علامت بزنید یا برنامه را ویرایش کنید.",
          placement: "bottom",
          optional: true,
        },
      ],
    },
  },
  {
    pattern: /^\/ventures\/[^/]+$/,
    tour: {
      id: "page-venture-detail",
      name: "راهنمای کسب‌وکار",
      steps: [
        {
          target: DETAIL_TOP,
          title: "کسب‌وکار مشترک",
          description: "همه چیز درباره این کسب‌وکار و شرکایش.",
          placement: "bottom",
          centerIfMissing: true,
        },
        {
          target: '[data-tour="detail-tabs"]',
          title: "بخش‌ها",
          description: "نمای کلی، شرکا و سهمشان، برد کارها، تراکنش‌ها و تنظیمات.",
          placement: "bottom",
          optional: true,
        },
      ],
    },
  },
];

export const PERSONA_TOURS: Record<string, TourDefinition> = {
  personal: ONBOARDING_TOUR,
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

  for (const { pattern, tour } of DETAIL_TOURS) {
    if (pattern.test(pathname)) return tour;
  }

  // Longest matching section prefix, so /projects/attendance never falls
  // back to the /projects tour.
  let best: string | null = null;
  for (const path of Object.keys(PAGE_TOURS)) {
    if (path === PATHS.HOME || !pathname.startsWith(`${path}/`)) continue;
    if (!best || path.length > best.length) best = path;
  }

  return best ? PAGE_TOURS[best] : null;
}
