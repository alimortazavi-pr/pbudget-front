"use client";

import Link from "next/link";
import { Box1, Category, Setting2 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { useTranslation } from "@/components/providers/LanguageProvider";

const LINKS = [
  { href: PATHS.CATEGORIES, label: "nav.categories", icon: Category },
  { href: PATHS.BOXES, label: "nav.boxes", icon: Box1 },
  { href: PATHS.SETTINGS, label: "nav.settings", icon: Setting2 },
] as const;

export function SimpleProfileShortcuts() {
  const { t } = useTranslation();

  return (
    <div className="glass rounded-2xl p-5">
      <h2 className="text-lg font-bold">{t("common.quickAccess")}</h2>
      <div className="mt-4 flex flex-col gap-1">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-secondary"
          >
            <item.icon size={20} />
            {t(item.label)}
          </Link>
        ))}
      </div>
    </div>
  );
}
