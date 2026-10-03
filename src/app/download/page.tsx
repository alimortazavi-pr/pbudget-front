import { createTranslator } from "@/i18n";
import { DownloadPage } from "@/components/pages/download/DownloadPage";
import { APP_NAME_EN, APP_NAME_FA } from "@/common/constants/brand";
import {
  absoluteUrl,
  createPublicPageMetadata,
  serializeJsonLd,
  SITE_URL,
} from "@/common/seo";

const t = createTranslator("fa", true);
const title = t("download.badge", { appName: APP_NAME_FA });
const description =
  "دانلود مستقیم اپ اندروید میز پردیس برای مدیریت مالی شخصی، ثبت درآمد و هزینه، اقساط، چک، پروژه و برنامه‌ریزی با تقویم شمسی.";

export const metadata = createPublicPageMetadata({
  title,
  description,
  path: "/download",
  keywords: ["دانلود اپ مدیریت مالی", "دانلود برنامه حسابداری شخصی اندروید"],
});

export default function Page() {
  const installUrl = process.env.NEXT_PUBLIC_APK_URL ?? "/downloads/pdesk.apk";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${absoluteUrl("/download")}#android-app`,
    name: APP_NAME_FA,
    alternateName: APP_NAME_EN,
    description,
    url: absoluteUrl("/download"),
    installUrl: installUrl.startsWith("http")
      ? installUrl
      : absoluteUrl(installUrl),
    applicationCategory: "FinanceApplication",
    applicationSubCategory: "Personal finance",
    operatingSystem: "Android 7.0 or later",
    offers: { "@type": "Offer", price: 0, priceCurrency: "IRR" },
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: "fa-IR",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <DownloadPage />
    </>
  );
}
