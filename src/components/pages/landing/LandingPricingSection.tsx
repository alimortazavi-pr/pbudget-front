"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@heroui/react";
import { TickCircle } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { toPersianDigits } from "@/common/utils";

type LandingPricingSectionProps = {
  pricing: ILandingContent["pricing"];
  primaryCta: string;
  onContactPress?: () => void;
  showHeader?: boolean;
};

export function LandingPricingSection({
  pricing,
  primaryCta,
  onContactPress,
  showHeader = true,
}: LandingPricingSectionProps) {
  return (
    <div>
      {showHeader ? (
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-[var(--brand-violet)]">
            {pricing.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold md:text-4xl">{pricing.title}</h2>
          <p className="mt-3 text-sm lp-muted md:text-base">{pricing.description}</p>
        </div>
      ) : null}
      <div className={`grid gap-4 md:grid-cols-3 ${showHeader ? "mt-10" : ""}`}>
        {pricing.plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            className={`landing-bento lp-card flex h-full flex-col rounded-2xl p-6 ${
              plan.highlighted
                ? "border-2 border-[var(--brand-rose)] shadow-lg shadow-rose-500/10"
                : ""
            }`}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="mt-2 text-3xl font-bold">
              {toPersianDigits(plan.price)}
              <span className="mr-1 text-sm font-normal lp-muted">/ {plan.period}</span>
            </p>
            <p className="mt-3 text-sm lp-muted">{plan.description}</p>
            <ul className="mt-5 flex-1 space-y-2">
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
            <div className="mt-6">
              {plan.id === "personal" ? (
                <Link href={primaryCta}>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "primary" : "secondary"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "primary" : "secondary"}
                  onPress={onContactPress}
                >
                  {plan.cta}
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
