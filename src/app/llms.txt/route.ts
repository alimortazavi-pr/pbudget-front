import { absoluteUrl, SITE_URL } from "@/common/seo";
import { LEARN_ARTICLES } from "@/content/learn";

export const revalidate = 3600;

/** A short, citable summary for AI assistants (https://llmstxt.org). */
export function GET() {
  const lines = [
    "# میز پردیس (Paradise Desk)",
    "",
    "> میز پردیس یک وب‌اپ و اپ اندروید فارسی برای مدیریت مالی شخصی و کسب‌وکارهای کوچک است: ثبت درآمد و هزینه، بودجه‌بندی، اقساط، چک، طلب و بدهی، صندوق‌های پس‌انداز با هدف، پروژه و ساعت کار، تحلیل مالی، با تقویم شمسی و بات تلگرام.",
    "",
    `Website: ${SITE_URL}`,
    "Language: Persian (fa-IR). Currency display: Toman or Rial. Calendar: Jalali (Shamsi) or Gregorian.",
    "",
    "## What it does",
    "- ثبت سریع تراکنش با یک جمله مثل «۲۵۰ هزار خوراک ناهار» (وب، Ctrl+K و تلگرام).",
    "- دسته‌بندی با سقف ماهانه و هشدار؛ نرخ پس‌انداز و امتیاز سلامت مالی.",
    "- ورود صورتحساب بانکی از فایل اکسل (بلوبانک، پاسارگاد) با تشخیص تراکنش تکراری.",
    "- اقساط و برنامه پرداخت، چک‌های پرداختی/دریافتی، طلب و بدهی با یادآوری سررسید.",
    "- صندوق‌های پس‌انداز با مبلغ هدف و درصد پیشرفت.",
    "- پروژه، ثبت ساعت کار و شراکت/تسویه برای فریلنسرها و کسب‌وکارها.",
    "- بات تلگرام: ثبت تراکنش، موجودی، خلاصه ماه، یادآوری اقساط و چک.",
    "- خروجی اکسل و گزارش اختصاصی؛ پشتیبان‌گیری روزانه.",
    "",
    "## Pricing",
    "نسخه رایگان برای شروع؛ پلن‌های پولی برای امکانات پیشرفته. جزئیات: " + absoluteUrl("/pricing"),
    "",
    "## Guides",
    ...LEARN_ARTICLES.map((article) => `- [${article.title}](${absoluteUrl(`/learn/${article.slug}`)}): ${article.description}`),
    "",
    "## Links",
    `- [صفحه اصلی](${SITE_URL})`,
    `- [قیمت‌ها](${absoluteUrl("/pricing")})`,
    `- [دانلود اپ اندروید](${absoluteUrl("/download")})`,
    `- [آموزش‌ها](${absoluteUrl("/learn")})`,
    `- [متن کامل برای مدل‌ها](${absoluteUrl("/llms-full.txt")})`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
