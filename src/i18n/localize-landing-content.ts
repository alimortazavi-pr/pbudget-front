import type { ILandingContent } from "@/common/interfaces/landing.interface";
import type { Language } from "./types";

type Translator = (
  key: string,
  params?: Record<string, string | number>,
) => string;

export function localizeLandingContent(
  base: ILandingContent,
  t: Translator,
  language: Language,
): ILandingContent {
  if (language === "fa") return base;

  return {
    ...base,
    hero: {
      badge: t("landing.hero.badge"),
      title: t("landing.hero.title"),
      tagline: t("landing.hero.tagline"),
      description: t("landing.hero.description"),
      primaryCta: t("landing.hero.primaryCta"),
      secondaryCta: t("landing.hero.secondaryCta"),
    },
    nav: base.nav.map((item) => ({
      ...item,
      label: t(`landing.nav.${item.id}`),
    })),
    stats: base.stats.map((stat, i) => ({
      value: t(`landing.stats.s${i}.value`),
      label: t(`landing.stats.s${i}.label`),
    })),
    features: base.features.map((f) => ({
      ...f,
      title: t(`landing.features.${f.id}.title`),
      description: t(`landing.features.${f.id}.description`),
      tags: (f.tags ?? []).map((_, ti) =>
        t(`landing.features.${f.id}.tags.${ti}`),
      ),
    })),
    whyUs: base.whyUs.map((item, i) => ({
      title: t(`landing.whyUs.w${i}.title`),
      description: t(`landing.whyUs.w${i}.description`),
    })),
    howSteps: base.howSteps.map((step, i) => ({
      step: t(`landing.howSteps.h${i}.step`),
      title: t(`landing.howSteps.h${i}.title`),
      description: t(`landing.howSteps.h${i}.description`),
    })),
    faq: base.faq.map((item, i) => ({
      q: t(`landing.faq.f${i}.q`),
      a: t(`landing.faq.f${i}.a`),
    })),
    contact: {
      ...base.contact,
      title: t("landing.contact.title"),
      description: t("landing.contact.description"),
    },
    about: {
      title: t("landing.about.title"),
      paragraphs: base.about.paragraphs.map((_, i) =>
        t(`landing.about.paragraphs.${i}`),
      ),
    },
    marquee: base.marquee.map((_, i) => t(`landing.marquee.${i}`)),
    settings: {
      ...base.settings,
      downloadLabel: t("landing.settings.downloadLabel"),
    },
    pricing: {
      eyebrow: t("landing.pricing.eyebrow"),
      title: t("landing.pricing.title"),
      description: t("landing.pricing.description"),
      plans: base.pricing.plans.map((plan) => ({
        ...plan,
        name: t(`landing.pricing.plans.${plan.id}.name`),
        price: t(`landing.pricing.plans.${plan.id}.price`),
        period: t(`landing.pricing.plans.${plan.id}.period`),
        description: t(`landing.pricing.plans.${plan.id}.description`),
        features: plan.features.map((_, fi) =>
          t(`landing.pricing.plans.${plan.id}.features.${fi}`),
        ),
        cta: t(`landing.pricing.plans.${plan.id}.cta`),
      })),
    },
    seo: {
      ...base.seo,
      title: t("landing.seo.title"),
      description: t("landing.seo.description"),
    },
  };
}

export function landingDashboardCta(t: Translator): string {
  return t("landing.hero.dashboardCta");
}

export function landingWhyTitle(t: Translator): string {
  return t("landing.hero.whyTitle");
}

export function landingContactLabels(t: Translator) {
  return {
    email: t("landing.contact.emailLabel"),
    telegram: t("landing.contact.telegramLabel"),
    phone: t("landing.contact.phoneLabel"),
  };
}
