"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Image from "next/image";
import Link from "next/link";
import { Home2 } from "iconsax-reactjs";

import { BUSINESS_BRAND, BUSINESS_SITE_URL, PRODUCT_FAMILY } from "@/common/constants/products";

type ProductFamilyBannerProps = {
  variant?: "header" | "footer" | "section";
};

const bizLogo = "/assets/business-logo-mark.svg";

export function ProductFamilyBanner({ variant = "section" }: ProductFamilyBannerProps) {
  const { t } = useTranslation();
  const business = PRODUCT_FAMILY.business;

  if (variant === "header") {
    return (
      <Link
        href={BUSINESS_SITE_URL}
        className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:inline-flex"
        style={{
          borderColor: BUSINESS_BRAND.border,
          background: BUSINESS_BRAND.surface,
          color: BUSINESS_BRAND.emeraldDeep,
        }}
      >
        <Image src={bizLogo} alt="" width={22} height={22} className="rounded-md" />
        {t(business.taglineKey)}
      </Link>
    );
  }

  if (variant === "footer") {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border/40 pt-6 md:justify-start">
        <span className="text-xs lp-muted">{t("auto.k5766a2c32f")}</span>
        <Link
          href={BUSINESS_SITE_URL}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition hover:opacity-90"
          style={{
            background: BUSINESS_BRAND.surface,
            color: BUSINESS_BRAND.emeraldDeep,
          }}
        >
          <Image src={bizLogo} alt="" width={20} height={20} className="rounded-md" />
          {t(business.nameKey)}
        </Link>
      </div>
    );
  }

  return (
    <section
      className="border-y lp-border py-10"
      style={{ background: "color-mix(in oklch, #2dd4bf 7%, transparent)" }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 text-center md:flex-row md:justify-between md:px-6 md:text-start">
        <div className="flex items-center gap-4">
          <span
            className="flex size-16 shrink-0 items-center justify-center rounded-2xl p-2 shadow-md ring-1 ring-teal-500/20"
            style={{ background: "linear-gradient(145deg, #ecfdf5, #ccfbf1)" }}
          >
            <Image src={bizLogo} alt="" width={52} height={52} className="rounded-xl" />
          </span>
          <div>
            <p className="text-base font-bold">{t(business.nameKey)}</p>
            <p className="text-sm lp-muted">{t(business.taglineKey)}</p>
          </div>
        </div>
        <Link
          href={BUSINESS_SITE_URL}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${BUSINESS_BRAND.emeraldDeep}, ${BUSINESS_BRAND.primaryDeep})`,
          }}
        >
          <Image src={bizLogo} alt="" width={22} height={22} className="rounded-md" />
          {t("auto.k6c9b610326")}
        </Link>
        <div className="flex items-center gap-2 text-xs lp-muted">
          <Home2 size={14} />
          {t("auto.k7f620f4208")}
        </div>
      </div>
    </section>
  );
}
