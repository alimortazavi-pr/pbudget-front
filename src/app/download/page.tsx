import { createTranslator } from "@/i18n";
import { DownloadPage } from "@/components/pages/download/DownloadPage";

const t = createTranslator("fa", true);

export const metadata = {
  title: t("download.badge", { appName: "Paradise Budget" }),
  description: t("download.descriptionReady", {
    tagline: "Paradise Budget",
  }),
};

export default function Page() {
  return <DownloadPage />;
}
