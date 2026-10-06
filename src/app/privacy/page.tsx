import Link from "next/link";

import { APP_NAME_FA, CONTACT_EMAIL, DEVELOPER_SITE_LABEL, DEVELOPER_SITE_URL } from "@/common/constants/brand";
import { PATHS } from "@/common/constants/PATHS";
import { createPublicPageMetadata } from "@/common/seo";

const title = `سیاست حفظ حریم خصوصی — ${APP_NAME_FA}`;
const description =
  "چه اطلاعاتی از شما نگه‌داری می‌کنیم، برای چه کاری استفاده می‌شود، با چه کسانی به اشتراک گذاشته می‌شود و چطور می‌توانید آن را حذف کنید.";

export const metadata = createPublicPageMetadata({ title, description, path: "/privacy" });

const sections: { heading: string; body: string[] }[] = [
  {
    heading: "اطلاعاتی که دریافت می‌کنیم",
    body: [
      "اطلاعات حساب: نام، نام خانوادگی و شمارهٔ موبایل شما که هنگام ثبت‌نام وارد می‌کنید. اگر رمز عبور تعیین کنید، فقط نسخهٔ رمزنگاری‌شدهٔ آن نگه‌داری می‌شود.",
      "اطلاعات مالی و برنامه‌ریزی که خودتان ثبت می‌کنید: تراکنش‌ها، دسته‌بندی‌ها، صندوق‌ها، بدهی‌ها، اقساط، چک‌ها، یادداشت‌ها، پروژه‌ها و تسک‌ها. این اطلاعات فقط برای نمایش و تحلیل در حساب خودتان استفاده می‌شود.",
      "فایل صورتحساب بانکی: اگر قابلیت «ورود صورتحساب بانکی» را استفاده کنید، فایلی که انتخاب می‌کنید فقط برای استخراج تراکنش‌ها پردازش می‌شود.",
      "اطلاعات فنی: گزارش درخواست‌ها (زمان، نشانی صفحه، نوع دستگاه و مرورگر) برای امنیت، عیب‌یابی و پایش کیفیت سرویس، و آمار استفادهٔ ناشناس از طریق Google Analytics در وب‌سایت.",
      "اگر تلگرام را به حساب خود وصل کنید، شناسهٔ تلگرام شما برای ارسال یادآوری‌ها و ثبت سریع تراکنش نگه‌داری می‌شود.",
    ],
  },
  {
    heading: "این اطلاعات را برای چه استفاده می‌کنیم",
    body: [
      "ورود به حساب (ارسال کد تأیید پیامکی)، نمایش اطلاعات مالی شما، ارسال یادآوری‌ها و اعلان‌هایی که فعال کرده‌اید، پشتیبانی، مدیریت اشتراک و جلوگیری از سوءاستفاده.",
      "اطلاعات شما را برای تبلیغات نمی‌فروشیم و برای تبلیغات به شخص یا سازمان دیگری نمی‌دهیم.",
    ],
  },
  {
    heading: "اشتراک اطلاعات با اشخاص ثالث",
    body: [
      "فقط به اندازهٔ لازم برای ارائهٔ سرویس: سرویس پیامک (ارسال کد تأیید به شمارهٔ شما)، تلگرام (در صورت وصل‌کردن حساب)، Google Analytics (آمار ناشناس بازدید) و کافه‌بازار (در صورت خرید اشتراک از داخل اپ بازار؛ پرداخت را بازار انجام می‌دهد و ما شمارهٔ کارت شما را نمی‌بینیم).",
      "اگر قانون از ما بخواهد، اطلاعات را مطابق مراجع قانونی ارائه می‌کنیم.",
    ],
  },
  {
    heading: "امنیت",
    body: [
      "ارتباط با سرویس از طریق HTTPS رمزنگاری می‌شود و دسترسی به داده‌ها با احراز هویت محدود است. با این حال هیچ سیستمی صددرصد ایمن نیست؛ رمز عبور خود را محرمانه نگه دارید.",
    ],
  },
  {
    heading: "نگه‌داری و حذف اطلاعات",
    body: [
      "اطلاعات شما تا زمانی که حساب فعال است نگه‌داری می‌شود. برای حذف حساب و اطلاعات مرتبط، از نشانی ایمیل زیر درخواست دهید؛ پس از احراز هویت، آن را حذف می‌کنیم (به‌جز مواردی که قانون نگه‌داری‌شان را الزامی کرده است).",
    ],
  },
  {
    heading: "مجوزهای اپ اندروید",
    body: [
      "اپ اندروید فقط به اینترنت دسترسی دارد. به مخاطبین، موقعیت مکانی، میکروفون، دوربین یا فایل‌های دستگاه شما دسترسی نمی‌گیرد.",
    ],
  },
  {
    heading: "تغییرات و تماس",
    body: [
      "اگر این متن تغییر مهمی کند، تاریخ به‌روزرسانی در همین صفحه تغییر می‌کند.",
    ],
  },
];

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 md:py-16">
      <Link href={PATHS.LANDING} className="text-sm text-muted hover:text-foreground">
        ← بازگشت
      </Link>
      <h1 className="mt-6 text-2xl font-extrabold md:text-3xl">سیاست حفظ حریم خصوصی</h1>
      <p className="mt-2 text-sm text-muted">{APP_NAME_FA} · آخرین به‌روزرسانی: مهر ۱۴۰۵</p>
      <p className="mt-6 leading-8">
        این متن توضیح می‌دهد {APP_NAME_FA} (وب‌سایت و اپ اندروید) چه اطلاعاتی از شما دریافت می‌کند، چرا، و چه اختیاری روی آن دارید.
      </p>
      {sections.map((section) => (
        <section key={section.heading} className="mt-8">
          <h2 className="text-lg font-bold">{section.heading}</h2>
          <div className="mt-2 space-y-3 leading-8 text-muted">
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-8 leading-8">
        پرسش یا درخواست حذف اطلاعات:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr" className="font-medium text-accent hover:underline">
          {CONTACT_EMAIL}
        </a>{" "}
        · توسعه‌دهنده:{" "}
        <a href={DEVELOPER_SITE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:underline">
          {DEVELOPER_SITE_LABEL}
        </a>
      </p>
    </main>
  );
}
