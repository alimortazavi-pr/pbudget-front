/**
 * Auto-translates Persian UI strings to English/Arabic using pattern rules.
 * Run: node scripts/auto-translate-en-ar.mjs && node scripts/build-generated-messages.mjs
 */
import fs from "fs";

const extracted = JSON.parse(
  fs.readFileSync("scripts/i18n-extracted.json", "utf8"),
);
const existing = JSON.parse(
  fs.readFileSync("scripts/i18n-translations.json", "utf8"),
);

const direct = {
  "ذخیره": "Save",
  "انصراف": "Cancel",
  "بستن": "Close",
  "حذف": "Delete",
  "ویرایش": "Edit",
  "ایجاد": "Create",
  "تأیید": "Confirm",
  "جستجو": "Search",
  "فیلتر": "Filter",
  "اعمال": "Apply",
  "بازگشت": "Back",
  "راهنما": "Help",
  "تنظیمات": "Settings",
  "پروفایل": "Profile",
  "خروج از حساب": "Log out",
  "خروج": "Log out",
  "پشتیبانی": "Support",
  "داشبورد": "Dashboard",
  "صندوق‌ها": "Boxes",
  "دسته‌بندی‌ها": "Categories",
  "یادداشت‌ها": "Notes",
  "پروژه‌ها": "Projects",
  "اقساط": "Installments",
  "چک‌ها": "Checks",
  "خطا": "Error",
  "ذخیره شد": "Saved",
  "حذف شد": "Deleted",
  "در حال بارگذاری…": "Loading…",
  "نام": "Name",
  "موبایل": "Mobile",
  "رمز عبور": "Password",
  "عنوان": "Title",
  "مبلغ": "Amount",
  "تاریخ": "Date",
  "توضیحات": "Description",
  "بله": "Yes",
  "خیر": "No",
  "همه": "All",
  "روزانه": "Daily",
  "ماهانه": "Monthly",
  "سالانه": "Yearly",
  "تومان": "Toman",
  "دلار": "USD",
  "دینار": "IQD",
  "حالت روشن": "Light mode",
  "حالت تاریک": "Dark mode",
  "ثبت": "Add",
  "بیشتر": "More",
  "خانه": "Home",
  "ناوبری اصلی": "Main navigation",
  "بازگشت به خانه": "Back to home",
  "صفحه پیدا نشد": "Page not found",
  "۴۰۴": "404",
  "میز شخصی": "Personal desk",
  "موجودی کیف پول": "Wallet balance",
  "تنظیم": "Configure",
  "حساب کاربری": "User account",
  "تراکنش‌ها": "Transactions",
  "تراکنشی یافت نشد": "No transactions found",
  "ظاهر": "Appearance",
  "تم روشن یا تاریک اپلیکیشن": "Light or dark app theme",
  "همگام‌سازی کسب‌وکار": "Business sync",
  "نسخه اپ": "App version",
  "مشاهده تغییرات": "View changelog",
  "بروزرسانی اپ": "Update app",
  "تماس با پشتیبانی": "Contact support",
  "در صورت نیاز با تیم پشتیبانی تماس بگیرید": "Contact support if you need help",
  "دستیار صوتی": "Voice assistant",
  "در حال پردازش…": "Processing…",
  "یا متن را اینجا بنویسید…": "Or type your message here…",
  "متن تشخیص‌داده‌شده": "Recognized text",
  "ثبت تراکنش": "Add transaction",
  "ویرایش تراکنش": "Edit transaction",
  "مدیریت پروژه": "Manage project",
  "برنامه پرداخت": "Payment plan",
  "طلب و بدهی": "Receivables & payables",
  "تحلیل مالی": "Financial analysis",
  "برنامه روزانه": "Daily planner",
  "تعهدات جاری": "Commitments",
  "بات تلگرام": "Telegram bot",
  "تغییر حساب": "Switch account",
  "افزودن اکانت": "Add account",
  "ناوبری دسکتاپ": "Desktop navigation",
  "پنل ادمین": "Admin panel",
  "بازگشت به اپ": "Back to app",
  "ارز و تقویم": "Currency & calendar",
  "ذخیره تنظیمات": "Save settings",
  "تنظیمات ذخیره شد": "Settings saved",
  "پروفایل ذخیره شد": "Profile saved",
  "انصراف": "Cancel",
  "انتخاب کنید": "Select",
  "الزامی است": "is required",
  "ناموفق": "failed",
  "موفق": "successful",
};

const wordEn = {
  ذخیره: "save", حذف: "delete", ویرایش: "edit", ایجاد: "create",
  خطا: "error", تنظیم: "configure", بروزرسانی: "update", مشاهده: "view",
  دانلود: "download", آپلود: "upload", ارسال: "send", اتصال: "connect",
  قطع: "disconnect", تأیید: "verify", انتخاب: "select", افزودن: "add",
  جستجو: "search", فیلتر: "filter", تراکنش: "transaction", دسته: "category",
  دسته‌بندی: "category", پروژه: "project", صندوق: "box", کاربر: "user",
  کاربران: "users", پنل: "panel", ادمین: "admin", بکاپ: "backup",
  لاگ: "log", بانک: "bank", تلگرام: "Telegram", موجودی: "balance",
  مبلغ: "amount", نام: "name", تاریخ: "date", توضیحات: "description",
  ثبت: "record", ورود: "login", خروج: "logout", جدید: "new",
  ویرایش: "edit", حذف: "delete", لیست: "list", گزارش: "report",
  تحلیل: "analysis", برنامه: "plan", پرداخت: "payment", دریافت: "receive",
  پرداخت: "payment", طلب: "receivable", بدهی: "debt", چک: "check",
  قسط: "installment", یادداشت: "note", تسک: "task", پروژه: "project",
  شریک: "partner", شرکا: "partners", حضور: "attendance", غیاب: "absence",
  ساعت: "hour", روز: "day", ماه: "month", سال: "year", هفته: "week",
  تنظیمات: "settings", پروفایل: "profile", پشتیبانی: "support",
  نسخه: "version", اپ: "app", موبایل: "mobile", ایمیل: "email",
  رمز: "password", عبور: "password", کد: "code", تأیید: "verification",
  ناموفق: "failed", موفق: "successful", الزامی: "required", اختیاری: "optional",
  همه: "all", جدید: "new", قدیمی: "old", فعال: "active", غیرفعال: "inactive",
  باز: "open", بسته: "closed", آنلاین: "online", آفلاین: "offline",
  داشبورد: "dashboard", صفحه: "page", منو: "menu", دکمه: "button",
  فایل: "file", فرمت: "format", خروجی: "export", ورودی: "import",
  دیتابیس: "database", محتوا: "content", لندینگ: "landing", بانک‌ها: "banks",
  مانیتورینگ: "monitoring", عملیات: "operations", سیستم: "system",
  مدیریت: "management", کارمند: "employee", تیم: "team", کسب‌وکار: "business",
  قرارداد: "contract", تسویه: "settlement", دعوت: "invite", پیام: "message",
  اعلان: "notification", یادآوری: "reminder", سررسید: "due date",
  مانده: "balance", مجموع: "total", درآمد: "income", هزینه: "expense",
  دریافتی: "income", پرداختی: "expense", افزایش: "increase", کاهش: "decrease",
  محدودیت: "limit", سقف: "ceiling", بدون: "without", با: "with",
  از: "from", به: "to", در: "in", برای: "for", و: "and", یا: "or",
  است: "is", شد: "was", شده: "has been", نشده: "not yet",
  هنوز: "not yet", هیچ: "no", موردی: "item", یافت: "found", نشد: "not found",
  لطفاً: "please", دوباره: "again", تلاش: "try", کنید: "",
  ابتدا: "first", سپس: "then", بعد: "after", قبل: "before",
  اتصال: "connection", قطع: "disconnect", وصل: "connect",
  فعال: "active", غیرفعال: "inactive", وضعیت: "status", نوع: "type",
};

function translateEn(fa) {
  if (direct[fa]) return direct[fa];

  // Pattern: X شد
  let m = fa.match(/^(.+?) شد$/);
  if (m) {
    const base = translateEn(m[1]) || wordEn[m[1]] || m[1];
    return `${base} saved/deleted/updated`.includes("/")
      ? `${capitalize(wordEn[m[1]] || m[1])} completed`
      : `${capitalize(base)}ed`;
  }

  // Pattern: خطا در X
  m = fa.match(/^خطا در (.+)$/);
  if (m) return `Error loading ${translateEn(m[1]) || m[1]}`;

  // Pattern: X الزامی است
  m = fa.match(/^(.+?) الزامی است$/);
  if (m) return `${translateEn(m[1]) || m[1]} is required`;

  // Pattern: X ناموفق
  m = fa.match(/^(.+?) ناموفق(?: بود)?$/);
  if (m) return `Failed to ${(wordEn[m[1]] || m[1]).toLowerCase()}`;

  // Pattern: هنوز X نکرده‌اید / نساخته‌اید
  m = fa.match(/^هنوز (.+?) (?:نکرده|نساخته)‌اید$/);
  if (m) return `You haven't created any ${m[1]} yet`;

  // Pattern: X یافت نشد
  m = fa.match(/^(.+?) یافت نشد$/);
  if (m) return `No ${m[1]} found`;

  // Pattern: در حال X…
  m = fa.match(/^در حال (.+?)…$/);
  if (m) return `${capitalize(m[1])}…`;

  // Word-by-word for short phrases
  if (fa.length < 40) {
    const words = fa.split(/\s+/);
    const en = words.map((w) => wordEn[w] || (w.length < 3 ? w : null)).filter(Boolean);
    if (en.length >= words.length * 0.6) return en.join(" ");
  }

  return fa; // keep fa as fallback
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function translateAr(fa, en) {
  // For Arabic, use simplified mapping for common + transliterate en for now
  const arDirect = {
    "Save": "حفظ", "Cancel": "إلغاء", "Close": "إغلاق", "Delete": "حذف",
    "Edit": "تعديل", "Create": "إنشاء", "Confirm": "تأكيد", "Search": "بحث",
    "Filter": "تصفية", "Apply": "تطبيق", "Back": "رجوع", "Help": "مساعدة",
    "Settings": "الإعدادات", "Profile": "الملف الشخصي", "Log out": "تسجيل الخروج",
    "Support": "الدعم", "Dashboard": "لوحة القيادة", "Error": "خطأ",
    "Loading…": "جارٍ التحميل…", "Home": "الرئيسية", "More": "المزيد",
    "Add": "إضافة", "Yes": "نعم", "No": "لا", "All": "الكل",
    "Daily": "يومي", "Monthly": "شهري", "Yearly": "سنوي",
    "Name": "الاسم", "Mobile": "الجوال", "Password": "كلمة المرور",
    "Title": "العنوان", "Amount": "المبلغ", "Date": "التاريخ",
    "Transactions": "المعاملات", "Notes": "ملاحظات", "Projects": "المشاريع",
    "Categories": "الفئات", "Boxes": "الصناديق", "Installments": "الأقساط",
    "Checks": "الشيكات", "Page not found": "الصفحة غير موجودة",
    "404": "404", "Light mode": "الوضع الفاتح", "Dark mode": "الوضع الداكن",
  };
  return arDirect[en] || (en !== fa ? en : fa);
}

const out = {};
let improved = 0;
for (const fa of Object.keys(extracted)) {
  const prev = existing[fa];
  let en = prev?.en !== fa ? prev.en : translateEn(fa);
  if (en === fa && direct[fa]) en = direct[fa];
  if (en !== fa) improved++;
  const ar = translateAr(fa, en);
  out[fa] = { en, ar };
}

fs.writeFileSync("scripts/i18n-translations.json", JSON.stringify(out, null, 2));
console.log(`Improved EN translations: ${improved}/${Object.keys(extracted).length}`);
