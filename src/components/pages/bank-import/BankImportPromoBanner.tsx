"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { DocumentUpload } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";

export function BankImportPromoBanner() {
  const { t } = useTranslation();
  return (
    <Link
      href={PATHS.BANK_IMPORT}
      className="group mx-4 flex items-center gap-3 rounded-2xl border border-accent/25 bg-accent/8 p-4 transition-colors hover:border-accent/40 hover:bg-accent/12 lg:mx-0"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent transition-colors group-hover:bg-accent/20">
        <DocumentUpload size={22} variant="Bold" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{t("ورود از صورتحساب بانک")}</p>
        <p className="mt-0.5 text-xs text-muted">
          فایل Excel بلوبانک را آپلود کنید و تراکنش‌ها را یکجا ثبت کنید
        </p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-accent">{t("شروع ←")}</span>
    </Link>
  );
}
