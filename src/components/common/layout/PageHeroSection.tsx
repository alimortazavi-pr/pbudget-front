"use client";

import type { ReactNode } from "react";

const VARIANT_CLASS: Record<string, string> = {
  teal: "bg-gradient-to-br from-teal-600 to-emerald-600",
  rose: "bg-gradient-to-br from-rose-500 to-rose-600",
  violet: "bg-gradient-to-br from-violet-600 to-indigo-600",
  violetDeep: "bg-gradient-to-br from-violet-600 to-indigo-700",
  amber: "bg-gradient-to-br from-amber-500 to-orange-600",
  emerald: "bg-gradient-to-br from-emerald-600 to-teal-700",
  slate: "bg-gradient-to-br from-slate-600 to-slate-700",
};

type PageHeroSectionProps = {
  variant?: keyof typeof VARIANT_CLASS;
  className?: string;
  eyebrow?: string;
  title: ReactNode;
  titleClassName?: string;
  description?: string;
  descriptionClassName?: string;
  aside?: ReactNode;
  footer?: ReactNode;
};

export function PageHeroSection({
  variant,
  className,
  eyebrow,
  title,
  titleClassName = "mt-1 text-2xl font-bold",
  description,
  descriptionClassName = "mt-2 text-sm leading-7 text-white/80",
  aside,
  footer,
}: PageHeroSectionProps) {
  const gradient = variant ? (VARIANT_CLASS[variant] ?? VARIANT_CLASS.teal) : "";
  const sectionClass = [
    "text-white shadow-lg",
    gradient,
    className ? "" : "rounded-3xl p-5",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const body = (
    <>
      {eyebrow ? (
        <p className="text-sm font-medium text-white/80">{eyebrow}</p>
      ) : null}
      <h1 className={titleClassName}>{title}</h1>
      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}
      {footer}
    </>
  );

  return (
    <section className={sectionClass}>
      {aside ? (
        <div className="flex items-start justify-between gap-3">
          <div>{body}</div>
          {aside}
        </div>
      ) : (
        body
      )}
    </section>
  );
}
