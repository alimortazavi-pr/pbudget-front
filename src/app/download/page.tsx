import { DownloadPage } from "@/components/pages/download/DownloadPage";
import { fetchPublicPlansServer } from "@/common/api/site";
import { APP_NAME_FA } from "@/common/constants/brand";
import {
  androidAppJsonLd,
  breadcrumbJsonLd,
  createPublicPageMetadata,
  jsonLdGraph,
  plansToOffers,
} from "@/common/seo";

export const revalidate = 3600;

const title = `دانلود اپلیکیشن مدیریت مالی شخصی ${APP_NAME_FA} برای اندروید`;
const description =
  "دانلود اپ اندروید میز پردیس (اندروید ۷ به بالا) برای حسابداری شخصی: ثبت درآمد و هزینه، بودجه‌بندی، اقساط، چک و صندوق پس‌انداز با تقویم شمسی؛ نسخه وب و PWA هم در دسترس است.";

export const metadata = createPublicPageMetadata({
  title,
  description,
  path: "/download",
  keywords: ["دانلود اپ مدیریت مالی", "دانلود برنامه حسابداری شخصی اندروید", "اپ مدیریت هزینه اندروید", "دانلود میز پردیس"],
});

export default async function Page() {
  const plans = await fetchPublicPlansServer();
  const nodes = [
    androidAppJsonLd(plansToOffers(plans)),
    breadcrumbJsonLd([
      { name: APP_NAME_FA, path: "/" },
      { name: "دانلود اپ اندروید", path: "/download" },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdGraph(nodes) }}
      />
      <DownloadPage />
    </>
  );
}
