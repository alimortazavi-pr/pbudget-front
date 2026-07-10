/**
 * Improved EN/AR translation generator.
 * Run: node scripts/auto-translate-en-ar.mjs && node scripts/build-generated-messages.mjs
 */
import fs from "fs";

const extracted = JSON.parse(
  fs.readFileSync("scripts/i18n-extracted.json", "utf8"),
);

/** fa -> en */
const faEn = {
  "ذخیره": "Save", "انصراف": "Cancel", "بستن": "Close", "حذف": "Delete",
  "ویرایش": "Edit", "ایجاد": "Create", "تأیید": "Confirm", "جستجو": "Search",
  "فیلتر": "Filter", "اعمال": "Apply", "بازگشت": "Back", "راهنما": "Help",
  "تنظیمات": "Settings", "پروفایل": "Profile", "خروج از حساب": "Log out",
  "خروج": "Log out", "پشتیبانی": "Support", "داشبورد": "Dashboard",
  "صندوق‌ها": "Boxes", "دسته‌بندی‌ها": "Categories", "یادداشت‌ها": "Notes",
  "پروژه‌ها": "Projects", "اقساط": "Installments", "چک‌ها": "Checks",
  "خطا": "Error", "ذخیره شد": "Saved", "حذف شد": "Deleted",
  "در حال بارگذاری…": "Loading…", "نام": "Name", "موبایل": "Mobile",
  "رمز عبور": "Password", "عنوان": "Title", "مبلغ": "Amount",
  "تاریخ": "Date", "توضیحات": "Description", "بله": "Yes", "خیر": "No",
  "همه": "All", "روزانه": "Daily", "ماهانه": "Monthly", "سالانه": "Yearly",
  "تومان": "Toman", "دلار": "USD", "دینار": "IQD",
  "حالت روشن": "Light mode", "حالت تاریک": "Dark mode",
  "ثبت": "Add", "بیشتر": "More", "خانه": "Home",
  "تراکنش‌ها": "Transactions", "تراکنشی یافت نشد": "No transactions found",
  "تراز دوره": "Period balance", "داشبورد مالی": "Financial dashboard",
  "موجودی کیف پول": "Wallet balance", "دریافتی دوره": "Period income",
  "پرداختی دوره": "Period expense", "تنظیم موجودی": "Adjust balance",
  "انصراف": "Cancel", "اعمال تغییر": "Apply change",
  "فیلتر بر اساس دسته‌بندی": "Filter by category",
  "همه دسته‌بندی‌ها": "All categories", "خروجی": "Export",
  "حضور و غیاب امروز": "Today's attendance",
  "ثبت دستی": "Manual entry", "میز شخصی": "Personal desk",
  "کاربر": "User", "سلام، علی 👋": "Hi, Ali 👋",
  "برای این بازه زمانی هنوز ثبت نشده": "Nothing recorded for this time range yet",
  "خطا در دریافت تراکنش‌ها": "Failed to load transactions",
  "تنظیم": "Configure", "حساب کاربری": "User account",
  "ناوبری اصلی": "Main navigation", "بازگشت": "Back",
};

/** en -> ar */
const enAr = {
  "Save": "حفظ", "Cancel": "إلغاء", "Close": "إغلاق", "Delete": "حذف",
  "Edit": "تعديل", "Create": "إنشاء", "Confirm": "تأكيد", "Search": "بحث",
  "Filter": "تصفية", "Apply": "تطبيق", "Back": "رجوع", "Help": "مساعدة",
  "Settings": "الإعدادات", "Profile": "الملف الشخصي", "Log out": "تسجيل الخروج",
  "Support": "الدعم", "Dashboard": "لوحة القيادة", "Boxes": "الصناديق",
  "Categories": "الفئات", "Notes": "ملاحظات", "Projects": "المشاريع",
  "Installments": "الأقساط", "Checks": "الشيكات", "Error": "خطأ",
  "Saved": "تم الحفظ", "Deleted": "تم الحذف", "Loading…": "جارٍ التحميل…",
  "Name": "الاسم", "Mobile": "الجوال", "Password": "كلمة المرور",
  "Title": "العنوان", "Amount": "المبلغ", "Date": "التاريخ",
  "Description": "الوصف", "Yes": "نعم", "No": "لا", "All": "الكل",
  "Daily": "يومي", "Monthly": "شهري", "Yearly": "سنوي",
  "Toman": "تومان", "USD": "دولار", "IQD": "دينار",
  "Light mode": "الوضع الفاتح", "Dark mode": "الوضع الداكن",
  "Add": "إضافة", "More": "المزيد", "Home": "الرئيسية",
  "Transactions": "المعاملات", "No transactions found": "لم يتم العثور على معاملات",
  "Period balance": "رصيد الفترة", "Financial dashboard": "لوحة المالية",
  "Wallet balance": "رصيد المحفظة", "Period income": "دخل الفترة",
  "Period expense": "مصروف الفترة", "Adjust balance": "ضبط الرصيد",
  "Apply change": "تطبيق التغيير", "Filter by category": "تصفية حسب الفئة",
  "All categories": "جميع الفئات", "Export": "تصدير",
  "Today's attendance": "حضور اليوم", "Manual entry": "إدخال يدوي",
  "Personal desk": "المكتب الشخصي", "User": "مستخدم",
  "Nothing recorded for this time range yet": "لا يوجد شيء مسجل لهذه الفترة بعد",
  "Failed to load transactions": "فشل تحميل المعاملات",
  "Configure": "إعداد", "User account": "حساب المستخدم",
  "Main navigation": "التنقل الرئيسي",
};

const wordFaEn = {
  ذخیره: "save", حذف: "delete", ویرایش: "edit", ایجاد: "create", خطا: "error",
  تنظیم: "configure", بروزرسانی: "update", مشاهده: "view", دانلود: "download",
  آپلود: "upload", ارسال: "send", اتصال: "connect", قطع: "disconnect",
  تأیید: "verify", انتخاب: "select", افزودن: "add", جستجو: "search",
  فیلتر: "filter", تراکنش: "transaction", دسته: "category",
  دسته‌بندی: "category", پروژه: "project", صندوق: "box", کاربر: "user",
  کاربران: "users", پنل: "panel", ادمین: "admin", بکاپ: "backup",
  لاگ: "log", بانک: "bank", تلگرام: "Telegram", موجودی: "balance",
  مبلغ: "amount", نام: "name", تاریخ: "date", توضیحات: "description",
  ثبت: "record", ورود: "login", خروج: "logout", جدید: "new",
  لیست: "list", گزارش: "report", تحلیل: "analysis", برنامه: "plan",
  پرداخت: "payment", دریافت: "receive", طلب: "receivable", بدهی: "debt",
  چک: "check", قسط: "installment", یادداشت: "note", تسک: "task",
  شریک: "partner", شرکا: "partners", حضور: "attendance", ساعت: "hour",
  روز: "day", ماه: "month", سال: "year", تنظیمات: "settings",
  پروفایل: "profile", پشتیبانی: "support", نسخه: "version", اپ: "app",
  موبایل: "mobile", رمز: "password", عبور: "password", کد: "code",
  ناموفق: "failed", موفق: "successful", الزامی: "required", اختیاری: "optional",
  همه: "all", فعال: "active", غیرفعال: "inactive", وضعیت: "status",
  نوع: "type", داشبورد: "dashboard", صفحه: "page", منو: "menu",
  فایل: "file", خروجی: "export", ورودی: "import", مدیریت: "management",
  کسب‌وکار: "business", تسویه: "settlement", دعوت: "invite", پیام: "message",
  یادآوری: "reminder", مانده: "balance", مجموع: "total", درآمد: "income",
  هزینه: "expense", دریافتی: "income", پرداختی: "expense",
  افزایش: "increase", کاهش: "decrease", محدودیت: "limit", سقف: "ceiling",
  بدون: "without", هنوز: "not yet", یافت: "found", نشد: "not found",
  لطفاً: "please", دوباره: "again", تلاش: "try", ابتدا: "first",
  امروز: "today", روزانه: "daily", ماهانه: "monthly", سالانه: "yearly",
  دوره: "period", بازه: "range", زمانی: "time", تراکنش‌ها: "transactions",
  تراکنشی: "transaction", کیف: "wallet", پول: "money", مالی: "financial",
  غیاب: "absence", دستی: "manual", کاری: "working", نیست: "is not",
};

const wordEnAr = {
  save: "حفظ", delete: "حذف", edit: "تعديل", create: "إنشاء", error: "خطأ",
  configure: "إعداد", update: "تحديث", view: "عرض", download: "تنزيل",
  upload: "رفع", send: "إرسال", connect: "اتصال", disconnect: "قطع",
  verify: "تحقق", select: "اختيار", add: "إضافة", search: "بحث",
  filter: "تصفية", transaction: "معاملة", category: "فئة", project: "مشروع",
  box: "صندوق", user: "مستخدم", users: "مستخدمون", panel: "لوحة",
  admin: "مسؤول", backup: "نسخ احتياطي", log: "سجل", bank: "بنك",
  balance: "رصيد", amount: "مبلغ", name: "الاسم", date: "التاريخ",
  description: "الوصف", record: "تسجيل", login: "دخول", logout: "خروج",
  new: "جديد", list: "قائمة", report: "تقرير", analysis: "تحليل",
  plan: "خطة", payment: "دفع", receive: "استلام", receivable: "مستحق",
  debt: "دين", check: "شيك", installment: "قسط", note: "ملاحظة",
  task: "مهمة", partner: "شريك", partners: "شركاء", attendance: "حضور",
  hour: "ساعة", day: "يوم", month: "شهر", year: "سنة", settings: "إعدادات",
  profile: "ملف شخصي", support: "دعم", version: "إصدار", app: "تطبيق",
  mobile: "جوال", password: "كلمة مرور", code: "رمز", failed: "فشل",
  successful: "ناجح", required: "مطلوب", optional: "اختياري", all: "الكل",
  active: "نشط", inactive: "غير نشط", status: "حالة", type: "نوع",
  dashboard: "لوحة", page: "صفحة", menu: "قائمة", file: "ملف",
  export: "تصدير", import: "استيراد", management: "إدارة",
  business: "أعمال", settlement: "تسوية", invite: "دعوة", message: "رسالة",
  reminder: "تذكير", total: "مجموع", income: "دخل", expense: "مصروف",
  increase: "زيادة", decrease: "نقصان", limit: "حد", ceiling: "سقف",
  without: "بدون", found: "وجد", "not found": "غير موجود", please: "يرجى",
  again: "مجدداً", try: "محاولة", first: "أولاً", today: "اليوم",
  daily: "يومي", monthly: "شهري", yearly: "سنوي", period: "فترة",
  range: "نطاق", time: "وقت", transactions: "معاملات", wallet: "محفظة",
  money: "مال", financial: "مالي", absence: "غياب", manual: "يدوي",
  working: "عمل", "is not": "ليس",
};

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function translateEn(fa) {
  if (faEn[fa]) return faEn[fa];

  let m = fa.match(/^(.+?) شد$/);
  if (m) {
    const w = wordFaEn[m[1]] || m[1];
    return `${capitalize(w)} completed`;
  }
  m = fa.match(/^خطا در (.+)$/);
  if (m) return `Error loading ${translateEn(m[1]) || m[1]}`;
  m = fa.match(/^(.+?) الزامی است$/);
  if (m) return `${translateEn(m[1]) || m[1]} is required`;
  m = fa.match(/^(.+?) ناموفق(?: بود)?$/);
  if (m) return `Failed to ${wordFaEn[m[1]] || m[1]}`;
  m = fa.match(/^(.+?) یافت نشد$/);
  if (m) return `No ${m[1]} found`;
  m = fa.match(/^در حال (.+?)…$/);
  if (m) return `${capitalize(m[1])}…`;
  m = fa.match(/^هنوز (.+?) (?:نکرده|نساخته)‌اید$/);
  if (m) return `You haven't created any ${m[1]} yet`;
  m = fa.match(/^(\d+) تراکنش در این (?:بازه|دوره)$/);
  if (m) return `${m[1]} transactions in this range`;

  if (fa.length < 50) {
    const words = fa.split(/\s+/);
    const en = words.map((w) => wordFaEn[w]).filter(Boolean);
    if (en.length >= Math.ceil(words.length * 0.5)) {
      return en.join(" ");
    }
  }
  return fa;
}

function translateArFromEn(en, fa) {
  if (enAr[en]) return enAr[en];
  if (faEn[fa]) {
    const fromDirect = enAr[faEn[fa]];
    if (fromDirect) return fromDirect;
  }
  if (en === fa) {
    // try word by word from fa
    const words = fa.split(/\s+/);
    const ar = words.map((w) => {
      const enW = wordFaEn[w];
      return enW ? (wordEnAr[enW] || w) : w;
    });
    if (ar.some((w, i) => w !== words[i])) return ar.join(" ");
    return fa;
  }
  const words = en.split(/\s+/);
  const ar = words.map((w) => wordEnAr[w.toLowerCase()] || w);
  if (ar.some((w, i) => w !== words[i])) return ar.join(" ");
  return en;
}

const out = {};
let enOk = 0;
let arOk = 0;

const allFa = new Set(Object.keys(extracted));
try {
  const map = JSON.parse(
    fs.readFileSync("src/i18n/persian-key-map.json", "utf8"),
  );
  for (const fa of Object.keys(map)) allFa.add(fa);
} catch {
  /* ignore */
}

for (const fa of allFa) {
  const en = translateEn(fa);
  const ar = translateArFromEn(en, fa);
  if (en !== fa) enOk++;
  if (ar !== fa) arOk++;
  out[fa] = { en, ar };
}

fs.writeFileSync("scripts/i18n-translations.json", JSON.stringify(out, null, 2));
console.log(`EN translated: ${enOk}/${Object.keys(extracted).length}`);
console.log(`AR translated: ${arOk}/${Object.keys(extracted).length}`);
