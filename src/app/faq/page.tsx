import type { Metadata } from "next";
import Link from "next/link";

import { PATHS } from "@/common/constants";
import { APP_NAME_FA } from "@/common/constants/brand";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  createPublicPageMetadata,
  faqPageJsonLd,
  jsonLdGraph,
  SITE_URL,
} from "@/common/seo";
import { LearnLayout } from "@/components/pages/learn/LearnLayout";
import { SITE_FAQ, SITE_FAQ_ITEMS } from "@/content/faq";

const TITLE = `سوالات متداول ${APP_NAME_FA}؛ امکانات، قیمت، پلتفرم‌ها و حریم خصوصی`;
const DESCRIPTION =
  "پاسخ کامل سوال‌های رایج درباره‌ی میز پردیس، اپلیکیشن فارسی مدیریت مالی شخصی: پلن رایگان و پولی، تقویم شمسی، ورود صورتحساب بانکی، اقساط و چک، بات تلگرام، اپ اندروید و امنیت اطلاعات.";

export const metadata: Metadata = createPublicPageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: "/faq",
  keywords: ["سوالات متداول میز پردیس", "اپ مدیریت مالی رایگان", "حسابداری شخصی سوالات"],
});

export default function FaqPage() {
  const url = absoluteUrl("/faq");
  const nodes = [
    {
      ...faqPageJsonLd(SITE_FAQ_ITEMS, `${url}#faq`),
      url,
      name: TITLE,
      description: DESCRIPTION,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#software` },
    },
    breadcrumbJsonLd([
      { name: APP_NAME_FA, path: "/" },
      { name: "سوالات متداول", path: "/faq" },
    ]),
  ];

  return (
    <LearnLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdGraph(nodes) }} />
      <div className="lx-container max-w-3xl py-12 md:py-16">
        <nav aria-label="مسیر صفحه" className="lx-muted text-xs">
          <Link href="/" className="hover:underline">{APP_NAME_FA}</Link> / سوالات متداول
        </nav>
        <h1 className="lx-h1 mt-4 !text-3xl md:!text-5xl">سوالات متداول</h1>
        <p className="lx-muted mt-4 text-base leading-8">
          {APP_NAME_FA} یک اپلیکیشن فارسی برای مدیریت مالی شخصی و حسابداری شخصی با تقویم شمسی است. پاسخ پرسش‌های رایج را در ادامه ببینید؛ برای راهنمای کامل‌تر به{" "}
          <Link href="/learn" className="font-semibold text-accent hover:underline">آموزش‌های مدیریت مالی</Link> سر بزنید.
        </p>

        <nav aria-label="بخش‌های سوالات" className="mt-8 flex flex-wrap gap-2 text-sm">
          {SITE_FAQ.map((group) => (
            <a key={group.id} href={`#${group.id}`} className="lx-nav-link border border-border/60">
              {group.title}
            </a>
          ))}
        </nav>

        <div className="pb-prose">
          {SITE_FAQ.map((group) => (
            <section key={group.id} id={group.id} aria-labelledby={`${group.id}-heading`} className="scroll-mt-20">
              <h2 id={`${group.id}-heading`}>{group.title}</h2>
              {group.items.map((item) => (
                <details key={item.q} className="lx-faq lx-card group !p-0" open>
                  <summary className="px-5 py-4 font-semibold">
                    <h3 className="inline text-base">{item.q}</h3>
                  </summary>
                  <p className="lx-muted px-5 pb-5 text-sm leading-8">{item.a}</p>
                </details>
              ))}
            </section>
          ))}
        </div>

        <aside className="l3-cta mt-12 !rounded-3xl !p-8 text-center">
          <h2 className="text-2xl font-extrabold">سوال دیگری دارید؟</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-8 opacity-90">
            پلن رایگان را امتحان کنید یا امکانات پلن‌ها را مقایسه کنید.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href={PATHS.GET_STARTED} className="lx-btn bg-white text-rose-600 shadow-xl">ساخت حساب رایگان</Link>
            <Link href={PATHS.PRICING} className="lx-btn border border-white/40 bg-white/10 text-white">قیمت و پلن‌ها</Link>
          </div>
        </aside>
      </div>
    </LearnLayout>
  );
}
