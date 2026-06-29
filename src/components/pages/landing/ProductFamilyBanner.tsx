"use client";

import Link from "next/link";
import { Building, Home2 } from "iconsax-reactjs";

import { BUSINESS_SITE_URL, PRODUCT_FAMILY } from "@/common/constants/products";

type ProductFamilyBannerProps = {
  variant?: "header" | "footer" | "section";
};

export function ProductFamilyBanner({ variant = "section" }: ProductFamilyBannerProps) {
  const business = PRODUCT_FAMILY.business;

  if (variant === "header") {
    return (
      <Link
        href={BUSINESS_SITE_URL}
        className="hidden items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 transition hover:bg-violet-500/15 dark:text-violet-300 sm:inline-flex"
      >
        <Building size={14} variant="Bold" />
        {business.tagline}
      </Link>
    );
  }

  if (variant === "footer") {
    return (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-border/40 pt-6 md:justify-start">
        <span className="text-xs lp-muted">محصولات مرتبط:</span>
        <Link
          href={BUSINESS_SITE_URL}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-500/15 dark:text-violet-300"
        >
          <Building size={14} />
          {business.name}
        </Link>
      </div>
    );
  }

  return (
    <section className="border-y lp-border bg-[color-mix(in_oklch,var(--brand-violet)_6%,transparent)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center md:flex-row md:justify-between md:px-6 md:text-start">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600">
            <Building size={22} variant="Bold" />
          </span>
          <div>
            <p className="text-sm font-semibold">{business.name}</p>
            <p className="text-sm lp-muted">{business.tagline}</p>
          </div>
        </div>
        <Link
          href={BUSINESS_SITE_URL}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700"
        >
          <Building size={16} />
          مشاهده میز کسب‌وکار
        </Link>
        <div className="flex items-center gap-2 text-xs lp-muted">
          <Home2 size={14} />
          شما اینجا: مالی شخصی
        </div>
      </div>
    </section>
  );
}
