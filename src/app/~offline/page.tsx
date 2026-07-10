"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { WifiSquare } from "iconsax-reactjs";

export default function OfflinePage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-500">
        <WifiSquare size={40} variant="Bold" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{t("اتصال اینترنت نیست")}</h1>
        <p className="max-w-sm text-sm text-muted">
          {t("برای استفاده از اپ به اینترنت نیاز دارید. وقتی وصل شدید دوباره تلاش کنید.")}
        </p>
      </div>
      <Button
        variant="primary"
        className="min-w-40"
        onPress={() => router.push("/")}
      >
        {t("تلاش مجدد")}
      </Button>
    </main>
  );
}
