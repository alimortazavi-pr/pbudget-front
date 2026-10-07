"use client";

import Link from "next/link";
import { Accordion } from "@heroui/react";
import { Flash, MessageQuestion, SecuritySafe, Shield, Timer1 } from "iconsax-reactjs";

import { PATHS } from "@/common/constants/PATHS";
import { toPersianDigits } from "@/common/utils";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function PlansTrustBar() {
  const { t } = useTranslation();
  const items = [
    { icon: SecuritySafe, title: t("common.subscription.trust.secureTitle"), body: t("common.subscription.trust.secureBody") },
    { icon: Flash, title: t("common.subscription.trust.instantTitle"), body: t("common.subscription.trust.instantBody") },
    { icon: Shield, title: t("common.subscription.trust.noRenewTitle"), body: t("common.subscription.trust.noRenewBody") },
    { icon: Timer1, title: t("common.subscription.trust.stackTitle"), body: t("common.subscription.trust.stackBody") },
  ];
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("common.subscription.trust.secureTitle")}>
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success-foreground">
            <item.icon size={20} variant="Bold" />
          </span>
          <div>
            <h3 className="text-sm font-bold">{item.title}</h3>
            <p className="mt-1 text-xs leading-6 text-muted">{item.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function PlansHowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { title: t("common.subscription.how.step1Title"), body: t("common.subscription.how.step1Body") },
    { title: t("common.subscription.how.step2Title"), body: t("common.subscription.how.step2Body") },
    { title: t("common.subscription.how.step3Title"), body: t("common.subscription.how.step3Body") },
  ];
  return (
    <section className="rounded-3xl border border-border/60 bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-bold">{t("common.subscription.how.title")}</h2>
      <ol className="mt-4 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/12 text-sm font-bold text-accent">{toPersianDigits(index + 1)}</span>
            <div>
              <h3 className="text-sm font-bold">{step.title}</h3>
              <p className="mt-1 text-xs leading-6 text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PlansFaq() {
  const { t } = useTranslation();
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({
    id: `q${n}`,
    question: t(`common.subscription.faq.q${n}`),
    answer: t(`common.subscription.faq.a${n}`),
  }));
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{t("common.subscription.faq.title")}</h2>
      <Accordion variant="surface" className="w-full">
        {items.map((item) => (
          <Accordion.Item key={item.id} id={item.id}>
            <Accordion.Heading>
              <Accordion.Trigger>
                {item.question}
                <Accordion.Indicator />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="text-sm leading-7 text-muted">{item.answer}</Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
}

export function PlansSupportCta() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-accent/25 bg-accent/8 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <MessageQuestion size={26} variant="Bold" className="mt-0.5 shrink-0 text-accent" />
        <div>
          <h2 className="font-bold">{t("common.subscription.needHelp")}</h2>
          <p className="mt-0.5 text-sm text-muted">{t("common.subscription.needHelpBody")}</p>
        </div>
      </div>
      <Link href={PATHS.SUPPORT} className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground">
        {t("common.subscription.contactSupport")}
      </Link>
    </section>
  );
}
