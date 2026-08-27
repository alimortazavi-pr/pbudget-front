"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { TickCircle } from "iconsax-reactjs";

import { BUSINESS_SITE_URL } from "@/common/constants/products";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { toPersianDigits } from "@/common/utils";

type LandingPricingSectionProps = {
  pricing: ILandingContent["pricing"];
  primaryCta: string;
  onContactPress?: () => void;
  showHeader?: boolean;
  headingLevel?: "h1" | "h2";
};

function planAction(
  plan: ILandingContent["pricing"]["plans"][number],
  primaryCta: string,
  onContactPress?: () => void,
) {
  if (plan.id === "personal") {
    return (
      <Link
        href={primaryCta}
        className={buttonVariants({
          className: "w-full",
          variant: plan.highlighted ? "primary" : "secondary",
        })}
      >
        {plan.cta}
      </Link>
    );
  }

  if (plan.id === "business" || plan.externalUrl) {
    const href = plan.externalUrl ?? BUSINESS_SITE_URL;
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({
          className: "w-full bg-gradient-to-l from-teal-600 to-emerald-700 text-white",
          variant: "primary",
        })}
      >
        {plan.cta}
      </a>
    );
  }

  return (
    <Button
      className="w-full"
      variant={plan.highlighted ? "primary" : "secondary"}
      onPress={onContactPress}
    >
      {plan.cta}
    </Button>
  );
}

export function LandingPricingSection({
  pricing,
  primaryCta,
  onContactPress,
  showHeader = true,
  headingLevel = "h2",
}: LandingPricingSectionProps) {
  const Heading = headingLevel;
  const planCount = pricing.plans.length;
  const gridClass =
    planCount === 1
      ? "mx-auto max-w-md"
      : planCount === 2
        ? "mx-auto max-w-3xl md:grid-cols-2"
        : "md:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      {showHeader ? (
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-[var(--brand-violet)]">
            {pricing.eyebrow}
          </p>
          <Heading className="mt-2 text-2xl font-bold md:text-4xl">{pricing.title}</Heading>
          <p className="mt-3 text-sm lp-muted md:text-base">{pricing.description}</p>
        </div>
      ) : null}
      <div className={`mt-10 grid gap-5 ${gridClass}`}>
        {pricing.plans.map((plan) => (
          <div
            key={plan.id}
            className={`landing-bento lp-card flex h-full flex-col rounded-2xl p-6 ${
              plan.highlighted
                ? "border-2 border-[var(--brand-rose)] shadow-lg shadow-rose-500/10 md:scale-[1.02]"
                : plan.id === "business"
                  ? "border-2 border-teal-500/35 shadow-lg shadow-teal-500/10"
                  : ""
            }`}
          >
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold">
              {toPersianDigits(plan.price)}
              {plan.period ? (
                <span className="mr-1 text-sm font-normal lp-muted">/ {plan.period}</span>
              ) : null}
            </p>
            <p className="mt-3 text-sm leading-relaxed lp-muted">{plan.description}</p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <TickCircle
                    size={16}
                    variant="Bold"
                    className="mt-0.5 shrink-0 text-[var(--brand-teal-deep)]"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">{planAction(plan, primaryCta, onContactPress)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
