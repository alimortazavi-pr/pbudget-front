import { useTranslation } from "@/components/providers/LanguageProvider";
import Link from "next/link";

import {
  CONTACT_EMAIL,
  DEVELOPER_SITE_LABEL,
  DEVELOPER_SITE_URL,
} from "@/common/constants/brand";

export function SiteFooterCredits({ className = "" }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs lp-muted ${className}`}
    >
      <span>{t("توسعه:")}</span>
      <Link
        href={DEVELOPER_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--brand-violet)] hover:underline dark:text-violet-300"
      >
        {DEVELOPER_SITE_LABEL}
      </Link>
      <span aria-hidden>·</span>
      <Link
        href={`mailto:${CONTACT_EMAIL}`}
        className="hover:underline"
        dir="ltr"
      >
        {CONTACT_EMAIL}
      </Link>
    </div>
  );
}
