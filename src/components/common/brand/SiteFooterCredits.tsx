"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";
import Link from "next/link";

import {
  CONTACT_EMAIL,
  DEVELOPER_SITE_LABEL,
  DEVELOPER_SITE_URL,
} from "@/common/constants/brand";

/** `compact`: stacked for narrow sidebars (no separator dot). */
export function SiteFooterCredits({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      className={`flex items-center justify-center text-xs text-muted ${
        compact ? "flex-col gap-0.5 text-[11px]" : "flex-wrap gap-x-3 gap-y-1"
      } ${className}`}
    >
      <span>{t("common.developedBy")}</span>
      <Link
        href={DEVELOPER_SITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--brand-violet)] hover:underline dark:text-violet-300"
      >
        {DEVELOPER_SITE_LABEL}
      </Link>
      {compact ? null : <span aria-hidden>·</span>}
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
