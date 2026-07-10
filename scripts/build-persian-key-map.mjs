/**
 * Maps Persian UI strings → semantic i18n keys.
 * Run: node scripts/build-persian-key-map.mjs
 */
import fs from "fs";

const SEMANTIC = {
  // common
  "ذخیره": "common.save",
  "انصراف": "common.cancel",
  "بستن": "common.close",
  "حذف": "common.delete",
  "ویرایش": "common.edit",
  "ایجاد": "common.create",
  "تأیید": "common.confirm",
  "جستجو": "common.search",
  "فیلتر": "common.filter",
  "اعمال": "common.apply",
  "بازگشت": "common.back",
  "راهنما": "common.help",
  "تنظیمات": "nav.settings",
  "پروفایل": "nav.profile",
  "خروج از حساب": "common.logout",
  "خروج": "common.logoutShort",
  "پشتیبانی": "common.support",
  "خطا": "common.error",
  "ذخیره شد": "common.saved",
  "حذف شد": "common.deleted",
  "در حال بارگذاری…": "common.loading",
  "نام": "common.name",
  "موبایل": "common.mobile",
  "رمز عبور": "common.password",
  "عنوان": "common.title",
  "مبلغ": "common.amount",
  "تاریخ": "common.date",
  "توضیحات": "common.description",
  "توضیح": "common.description",
  "بله": "common.yes",
  "خیر": "common.no",
  "همه": "common.all",
  "روزانه": "common.daily",
  "ماهانه": "common.monthly",
  "سالانه": "common.yearly",
  "خروجی": "common.export",
  "ثبت": "nav.create",
  "بیشتر": "nav.more",
  "خانه": "nav.home",
  "ناوبری اصلی": "common.mainNavigation",
  "ناوبری دسکتاپ": "common.desktopNavigation",
  "بازگشت به خانه": "common.backToHome",
  "صفحه پیدا نشد": "common.pageNotFound",
  "۴۰۴": "common.notFoundCode",
  "میز شخصی": "nav.personalDesk",
  "اصلی": "nav.primary",
  "موجودی کیف پول": "common.walletBalance",
  "تنظیم": "common.configure",
  "حساب کاربری": "common.userAccount",
  "حالت روشن": "common.lightMode",
  "حالت تاریک": "common.darkMode",
  "تغییر حساب": "common.changeAccount",
  "افزودن اکانت": "common.addAccount",
  "خروج ثبت شد": "projects.clockOutRecorded",
  "دستیار صوتی": "voice.title",
  "در حال پردازش…": "voice.processing",
  "یا متن را اینجا بنویسید…": "voice.typePlaceholder",
  "متن تشخیص‌داده‌شده": "voice.recognizedText",
  "خلاصه عملیات": "voice.actionSummary",
  "چه چیزهایی جدید است؟": "common.whatsNew",
  "اتصال اینترنت نیست": "common.noInternet",
  "تلاش مجدد": "common.tryAgain",
  "تراکنش ذخیره شد": "admin.transactionSaved",
  "ذخیره ناموفق بود": "common.saveFailed",
  "ویرایش تراکنش": "nav.editTransaction",
  "درآمد": "common.income",
  "هزینه": "common.expense",
  "ویرایش دسته": "categories.editCategory",
  "دسته ذخیره شد": "categories.categorySaved",
  "ویرایش پروژه": "projects.editProject",
  "پروژه ذخیره شد": "projects.projectSaved",
  "رنگ": "common.color",
  "سقف ماهانه": "common.monthlyLimit",
  "مبلغ کل": "common.totalAmount",
  "تسویه‌شده": "debts.settled",
  "باقی‌مانده": "debts.remaining",
  "منطقه خطر": "common.dangerZone",
  "قطع اتصال": "common.disconnect",
  "اتصال مبدأ قطع شد": "debts.sourceDetached",
  "تسویه جدا شد": "debts.settlementDetached",
  "جدا کردن تسویه": "debts.detachSettlement",
  "وصل تراکنش مبدأ": "debts.attachSource",
  "وصل تراکنش تسویه": "debts.attachSettlement",
  "یادآوری تلگرام": "planning.telegramReminder",
  "انجام شد": "common.done",
  "یادآوری": "common.reminder",
  "حذف خط": "planning.deleteLine",
  "بارگذاری محتوا ناموفق بود": "admin.contentLoadFailed",
  "مدیریت محتوا": "admin.contentManagement",
  "جستجو…": "common.searchEllipsis",
  "به‌روزرسانی شد": "common.updated",
  "انتخاب کنید": "common.select",
  "موردی یافت نشد": "common.noItemsFound",
  "همه دسته‌بندی‌ها": "dashboard.allCategories",
  "نام طرف حساب را انتخاب یا وارد کنید": "common.personAccountPlaceholder",
  "جستجو یا انتخاب دسته‌بندی": "common.searchCategoryPlaceholder",
  "دسته‌ای یافت نشد": "common.noCategoryFound",
};

// nav from labelToKeyMap
const NAV = {
  "ورود از بانک": "nav.bankImport",
  "ورود از صورتحساب بانک": "nav.bankImportFull",
  "تحلیل مالی": "nav.financialAnalysis",
  "صندوق‌ها": "nav.boxes",
  "کارت‌های من": "nav.myCards",
  "دسته‌بندی‌ها": "nav.categories",
  "برنامه روزانه": "nav.dailyPlanner",
  "یادداشت‌ها": "nav.notes",
  "پروژه‌ها": "nav.projects",
  "شرکا و تسویه": "nav.businessPartners",
  "حضور فریلنسری": "nav.workAttendance",
  "طلب و بدهی": "nav.debts",
  "اقساط": "nav.installments",
  "چک‌ها": "nav.checks",
  "تعهدات جاری": "nav.commitments",
  "بات تلگرام": "nav.telegramBot",
  "ثبت تراکنش": "nav.createTransaction",
  "برنامه‌ریزی": "nav.planning",
  "مالی پیشرفته": "nav.advancedFinance",
  "مشارکت": "nav.partnership",
  "داشبورد": "nav.dashboard",
};

const map = { ...NAV, ...SEMANTIC };

// Auto-assign remaining from extracted
const extracted = JSON.parse(
  fs.readFileSync("scripts/i18n-extracted.json", "utf8"),
);
const translations = JSON.parse(
  fs.readFileSync("scripts/i18n-translations.json", "utf8"),
);

let auto = 0;
for (const fa of Object.keys(extracted)) {
  if (map[fa]) continue;
  const slug = extracted[fa].replace(/[^\w]/g, "_").slice(0, 50);
  map[fa] = `auto.${slug}`;
  auto++;
}

fs.writeFileSync(
  "src/i18n/persian-key-map.json",
  JSON.stringify(map, null, 2),
);
console.log(`Mapped ${Object.keys(map).length} strings (${auto} auto keys)`);
