import { absoluteUrl, SITE_URL } from "@/common/seo";
import { LEARN_ARTICLES } from "@/content/learn";
import { PRODUCT_SUMMARY_EN } from "@/content/product-facts";

export const revalidate = 3600;

/** A short, citable index for AI assistants, following https://llmstxt.org. */
export function GET() {
  const lines = [
    "# میز پردیس (Paradise Desk)",
    "",
    "> میز پردیس یک اپلیکیشن فارسی برای مدیریت مالی شخصی و حسابداری شخصی است (وب، PWA و اندروید): ثبت دخل و خرج با یک جمله در وب یا تلگرام، بودجه‌بندی با سقف دسته‌ها، اقساط و چک با یادآوری سررسید، طلب و بدهی، صندوق‌های پس‌انداز با مبلغ هدف، ورود صورتحساب بانکی، پروژه و ساعت کار، با تقویم شمسی و نمایش تومان/ریال. پلن رایگان، دوره‌ی آزمایشی ۷ روزه و پلن‌های پولی دارد.",
    "",
    PRODUCT_SUMMARY_EN,
    "",
    `Website: ${SITE_URL} · Language: Persian (fa-IR, RTL) · Calendar: Jalali (default) or Gregorian · Currency display: Toman or Rial.`,
    "",
    "## Product",
    `- [صفحه اصلی و امکانات](${SITE_URL}/): معرفی میز پردیس، امکانات، نحوه‌ی کار و سوالات متداول`,
    `- [قیمت و پلن‌ها](${absoluteUrl("/pricing")}): پلن رایگان، دوره‌ی آزمایشی و پلن‌های پولی با قیمت روز`,
    `- [دانلود اپ اندروید](${absoluteUrl("/download")}): اپ اندروید ۷ به بالا و نصب PWA`,
    `- [سوالات متداول](${absoluteUrl("/faq")}): امکانات، قیمت، پلتفرم‌ها، امنیت و حریم خصوصی`,
    `- [سیاست حریم خصوصی](${absoluteUrl("/privacy")}): داده‌های نگه‌داری‌شده، اشتراک با سرویس‌ها، AI و حذف حساب`,
    `- [ثبت‌نام رایگان](${absoluteUrl("/get-started")}): ورود با شماره موبایل و کد پیامکی`,
    "",
    "## Guides",
    `- [همه آموزش‌ها](${absoluteUrl("/learn")}): راهنماهای فارسی مدیریت مالی شخصی`,
    ...LEARN_ARTICLES.map((article) => `- [${article.title}](${absoluteUrl(`/learn/${article.slug}`)}): ${article.description}`),
    "",
    "## Optional",
    `- [متن کامل برای مدل‌های زبانی](${absoluteUrl("/llms-full.txt")}): شرح کامل محصول، پلن‌ها، سوالات متداول و متن همه‌ی آموزش‌ها`,
    `- [Sitemap](${absoluteUrl("/sitemap.xml")})`,
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
