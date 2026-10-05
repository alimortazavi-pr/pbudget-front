"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Add,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Building,
  Calendar,
  Call,
  Chart,
  Clock,
  CloseCircle,
  DocumentDownload,
  HamburgerMenu,
  Messages2,
  Mobile,
  Notification,
  Profile2User,
  Send2,
  ShieldTick,
  Sms,
  TickCircle,
  Wallet2,
} from "iconsax-reactjs";

import * as subscriptionApi from "@/common/api/subscriptions";
import { PATHS } from "@/common/constants";
import { useAndroidAppAvailability } from "@/common/hooks/useAndroidAppAvailability";
import type { ILandingContent, LandingAccent } from "@/common/interfaces/landing.interface";
import type { SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { SiteFooterCredits } from "@/components/common/brand/SiteFooterCredits";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSelector } from "@/components/common/layout/LanguageSelector";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { formatLocalizedDigits } from "@/i18n/format-localized-digits";
import { landingContactLabels, landingWhyTitle } from "@/i18n/localize-landing-content";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { LandingContactForm } from "./LandingContactForm";
import { useLandingContent } from "./useLandingContent";

const FEATURE_ICONS: Record<string, typeof Wallet2> = {
  finance: Wallet2,
  boxes: Wallet2,
  bank: DocumentDownload,
  categories: Chart,
  debts: Clock,
  planning: Calendar,
  projects: Building,
  ventures: Profile2User,
  analysis: Chart,
  telegram: Send2,
};

const ACCENTS: LandingAccent[] = ["rose", "violet", "teal"];

/** Pick a column count that leaves no lonely card on the last row. */
function gridCols(count: number) {
  if (count % 4 === 0) return "sm:grid-cols-2 lg:grid-cols-4";
  if (count % 3 === 0) return "sm:grid-cols-2 lg:grid-cols-3";
  if (count === 2) return "sm:grid-cols-2";
  return "sm:grid-cols-2 lg:grid-cols-3";
}

function useScrolled(threshold = 16) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return scrolled;
}

/** Live plans from the subscription system; the CMS pricing is the fallback. */
function useLivePlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void subscriptionApi
      .fetchPublicSubscriptionPlans()
      .then((next) => !cancelled && setPlans(next))
      .catch(() => !cancelled && setPlans(null));
    return () => {
      cancelled = true;
    };
  }, []);
  return plans;
}

function SectionHeading({ eyebrow, title, subtitle, id }: { eyebrow: string; title: string; subtitle?: string; id?: string }) {
  return (
    <div className="lx-reveal mx-auto max-w-2xl text-center">
      <span className="lx-eyebrow">{eyebrow}</span>
      <h2 id={id} className="lx-h2 mt-4">
        {title}
      </h2>
      {subtitle ? <p className="lx-muted mt-4 text-base leading-8 md:text-lg">{subtitle}</p> : null}
    </div>
  );
}

function HeroMockup() {
  const { t, language } = useTranslation();
  const digits = (value: string) => formatLocalizedDigits(value, language);
  const bars = [42, 66, 38, 80, 54, 92, 70];
  const rows = [
    { label: t("landingUi.mockTx1"), amount: "+45,000,000", income: true, tone: "teal" as const },
    { label: t("landingUi.mockTx2"), amount: "−1,240,000", income: false, tone: "rose" as const },
    { label: t("landingUi.mockTx3"), amount: "−4,200,000", income: false, tone: "violet" as const },
    { label: t("landingUi.mockTx4"), amount: "+10,000,000", income: true, tone: "teal" as const },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[34rem]" aria-hidden>
      <div className="lx-device lx-float relative p-4 sm:p-5">
        <div className="lx-balance p-5">
          <p className="text-xs opacity-80">{t("landingUi.mockBalance")}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{digits("53,140,000")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="opacity-80">{t("landingUi.mockIncome")}</p>
              <p className="mt-0.5 text-sm font-bold">{digits("55,000,000")}</p>
            </div>
            <div className="rounded-xl bg-white/15 px-3 py-2">
              <p className="opacity-80">{t("landingUi.mockCost")}</p>
              <p className="mt-0.5 text-sm font-bold">{digits("29,460,000")}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex h-24 items-end gap-2 px-1">
          {bars.map((height, index) => (
            <div key={index} className="lx-bar flex-1" style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />
          ))}
        </div>

        <p className="mt-4 text-xs font-semibold text-muted">{t("landingUi.mockRecent")}</p>
        <ul className="mt-2 space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between rounded-xl bg-surface-secondary/70 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-2.5">
                <span className="lx-icon !size-8 !rounded-lg" data-accent={row.tone}>
                  {row.income ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                </span>
                {row.label}
              </span>
              <span className={`font-bold tabular-nums ${row.income ? "text-income" : "text-expense"}`} dir="ltr">
                {digits(row.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="lx-device lx-float-delayed absolute -start-4 -top-6 hidden w-64 p-3 sm:block md:-start-10">
        <div className="flex items-start gap-2.5">
          <span className="lx-icon !size-9 shrink-0" data-accent="violet">
            <Notification size={18} variant="Bold" />
          </span>
          <p className="text-xs leading-6">{t("landingUi.mockReminder")}</p>
        </div>
      </div>

      <div className="lx-device lx-float absolute -bottom-6 -end-3 hidden w-56 p-3 sm:block md:-end-8">
        <div className="flex items-start gap-2.5">
          <span className="lx-icon !size-9 shrink-0" data-accent="teal">
            <Profile2User size={18} variant="Bold" />
          </span>
          <p className="text-xs leading-6">{t("landingUi.mockDebt")}</p>
        </div>
      </div>
    </div>
  );
}

function TelegramMockup() {
  const { t } = useTranslation();
  return (
    <div className="lx-device mx-auto w-full max-w-md overflow-hidden" aria-hidden>
      <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white">
          <Send2 size={20} variant="Bold" />
        </span>
        <div>
          <p className="text-sm font-bold">Paradise Desk Bot</p>
          <p className="text-[11px] text-sky-500">online</p>
        </div>
      </div>
      <div className="lx-chat m-3 space-y-3 p-4">
        <div className="lx-bubble lx-bubble-me">{t("landingUi.chatUser")}</div>
        <div className="lx-bubble lx-bubble-bot">{t("landingUi.chatBot")}</div>
        <div className="lx-bubble lx-bubble-bot">{t("landingUi.chatReminder")}</div>
      </div>
    </div>
  );
}

export function LandingPage({ initialContent }: { initialContent?: ILandingContent }) {
  const { t, language } = useTranslation();
  const { content } = useLandingContent(initialContent);
  const isAuth = useAppSelector(isAuthSelector);
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const livePlans = useLivePlans();
  const { apkAvailable } = useAndroidAppAvailability();
  const contactLabels = landingContactLabels(t);
  const digits = (value: string) => formatLocalizedDigits(value, language);

  const primaryHref = isAuth ? PATHS.HOME : PATHS.GET_STARTED;
  const primaryLabel = isAuth ? t("landingUi.openApp") : content.hero.primaryCta || t("landingUi.start");
  const showDownload = !content.settings.downloadComingSoon || apkAvailable;

  const plans = useMemo(() => {
    if (livePlans && livePlans.length) {
      return livePlans.map((plan) => ({
        id: plan._id,
        name: plan.name,
        price: plan.price ? `${digits(plan.price.toLocaleString("en-US"))} ${plan.priceUnit}` : t("landingUi.free"),
        period:
          plan.price === 0
            ? ""
            : plan.period === "monthly"
              ? t("landingUi.perMonth")
              : plan.period === "yearly"
                ? t("landingUi.perYear")
                : plan.period === "lifetime"
                  ? t("landingUi.lifetime")
                  : `${digits(String(plan.periodDays ?? ""))}`,
        description: plan.description,
        features: plan.features.filter((feature) => feature.enabled).map((feature) => feature.label),
        highlighted: plan.highlighted,
        paid: plan.price > 0,
      }));
    }
    return content.pricing.plans.map((plan) => ({ ...plan, paid: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- digits depends on language only
  }, [livePlans, content.pricing.plans, language, t]);

  const navItems = content.nav.filter((item) => item.id !== "about");
  const trust = [
    { icon: Send2, label: t("landingUi.trustTelegram") },
    { icon: Calendar, label: t("landingUi.trustJalali") },
    { icon: Mobile, label: t("landingUi.trustPwa") },
    { icon: ShieldTick, label: t("landingUi.trustSecure") },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <div className="lx min-h-screen">
      {/* ------------------------------------------------ navigation */}
      <header className="lx-nav" data-scrolled={scrolled ? "true" : "false"}>
        <div className="lx-container flex h-16 items-center justify-between gap-4">
          <Link href={PATHS.LANDING} className="flex items-center gap-2.5" aria-label={content.hero.title}>
            <AppLogo size={34} showText={false} />
            <span className="text-base font-extrabold">{content.hero.title}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t("landingUi.menu")}>
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="lx-nav-link">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 sm:flex">
              <LanguageSelector />
              <ThemeToggle />
            </div>
            {!isAuth ? (
              <Link href={PATHS.GET_STARTED} className="lx-nav-link hidden font-semibold text-foreground md:inline-flex">
                {t("landingUi.login")}
              </Link>
            ) : null}
            <Link href={primaryHref} className="lx-btn lx-btn-primary lx-btn-sm">
              {primaryLabel}
            </Link>
            <button
              type="button"
              className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-foreground hover:bg-surface-secondary lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label={t("landingUi.menu")}
              aria-expanded={menuOpen}
            >
              <HamburgerMenu size={22} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="close" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-x-3 top-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-extrabold">
                <AppLogo size={30} showText={false} />
                {content.hero.title}
              </span>
              <button type="button" className="cursor-pointer rounded-full p-1.5 text-muted" onClick={() => setMenuOpen(false)} aria-label="close">
                <CloseCircle size={24} />
              </button>
            </div>
            <nav className="mt-4 grid gap-1">
              {navItems.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-surface-secondary" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
              {showDownload ? (
                <Link href={PATHS.DOWNLOAD} className="rounded-xl px-3 py-3 text-base font-medium hover:bg-surface-secondary">
                  {t("landingUi.downloadApp")}
                </Link>
              ) : null}
            </nav>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
              <div className="flex items-center gap-1">
                <LanguageSelector />
                <ThemeToggle />
              </div>
              <Link href={primaryHref} className="lx-btn lx-btn-primary lx-btn-sm">
                {primaryLabel}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <main>
        {/* ------------------------------------------------ hero */}
        <section className="relative -mt-16 overflow-hidden pt-16">
          <div className="lx-hero-bg" />
          <div className="lx-grid-bg" />
          <div className="lx-container relative grid items-center gap-14 pb-20 pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28 lg:pt-20">
            <div className="text-center lg:text-start">
              <span className="lx-eyebrow">
                <span className="size-2 rounded-full bg-[var(--lx-rose)]" />
                {content.hero.badge || t("landingUi.heroEyebrow")}
              </span>
              <h1 className="lx-h1 mt-6">
                {content.hero.title}
                <span className="lx-gradient-text mt-2 block pb-1">{content.hero.tagline}</span>
              </h1>
              <p className="lx-muted mx-auto mt-6 max-w-xl text-base leading-8 md:text-lg lg:mx-0">{content.hero.description}</p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <Link href={primaryHref} className="lx-btn lx-btn-primary w-full sm:w-auto">
                  {primaryLabel}
                  <ArrowLeft size={18} />
                </Link>
                <a href="#features" className="lx-btn lx-btn-ghost w-full sm:w-auto">
                  {content.hero.secondaryCta}
                </a>
              </div>
              <p className="lx-muted mt-4 text-xs">{t("landingUi.heroNote")}</p>

              <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {content.stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border/60 bg-surface/60 px-3 py-3 backdrop-blur">
                    <dt className="lx-muted text-[11px]">{stat.label}</dt>
                    <dd className="mt-1 text-xl font-extrabold">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <HeroMockup />
          </div>
        </section>

        {/* ------------------------------------------------ trust strip */}
        <section className="border-y border-border/60 bg-surface/60 py-5" aria-label={t("landingUi.featuresEyebrow")}>
          <div className="lx-container">
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {trust.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center justify-center gap-2 text-sm font-medium">
                  <Icon size={18} className="text-[var(--lx-rose)]" variant="Bold" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------------------------ features */}
        <section id="features" className="scroll-mt-20 py-20 md:py-28">
          <div className="lx-container">
            <SectionHeading eyebrow={t("landingUi.featuresEyebrow")} title={t("landingUi.featuresTitle")} subtitle={t("landingUi.featuresSubtitle")} />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[feature.id] ?? Wallet2;
                const accent = feature.accent ?? ACCENTS[index % ACCENTS.length];
                // Widen cards only as needed so the 3-column grid never leaves a gap.
                const remainder = content.features.length % 3;
                const wide =
                  (remainder === 2 && index === 0) ||
                  (remainder === 1 && (index === 0 || index === content.features.length - 1));
                return (
                  <article key={feature.id} className={`lx-card lx-card-hover lx-reveal p-6 ${wide ? "lg:col-span-2" : ""}`}>
                    <span className="lx-icon" data-accent={accent}>
                      <Icon size={22} variant="Bold" />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                    <p className="lx-muted mt-2 text-sm leading-7">{feature.description}</p>
                    {feature.tags?.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {feature.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-muted">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          {content.marquee?.length ? (
            <div className="lx-marquee mt-16 overflow-hidden" aria-hidden>
              <div className="lx-marquee-track">
                {[...content.marquee, ...content.marquee].map((label, index) => (
                  <span key={`${label}-${index}`} className="flex items-center gap-2 rounded-full border border-border/60 bg-surface px-4 py-2 text-sm text-muted">
                    <TickCircle size={16} className="text-[var(--lx-teal)]" variant="Bold" />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* ------------------------------------------------ telegram */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="lx-hero-bg opacity-60" />
          <div className="lx-container relative grid items-center gap-12 lg:grid-cols-2">
            <div className="lx-reveal">
              <span className="lx-eyebrow">
                <Send2 size={14} variant="Bold" />
                {t("landingUi.telegramEyebrow")}
              </span>
              <h2 className="lx-h2 mt-4">{t("landingUi.telegramTitle")}</h2>
              <p className="lx-muted mt-4 text-base leading-8 md:text-lg">{t("landingUi.telegramBody")}</p>
              <ul className="mt-6 space-y-3">
                {[t("landingUi.telegramPoint1"), t("landingUi.telegramPoint2"), t("landingUi.telegramPoint3")].map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm font-medium">
                    <span className="lx-icon !size-8 !rounded-lg" data-accent="teal">
                      <TickCircle size={16} variant="Bold" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lx-reveal">
              <TelegramMockup />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ how it works */}
        <section id="how" className="scroll-mt-20 py-20 md:py-28">
          <div className="lx-container">
            <SectionHeading eyebrow={t("landingUi.howEyebrow")} title={t("landingUi.howTitle")} />
            <ol className={`mt-14 grid gap-4 ${gridCols(content.howSteps.length)}`}>
              {content.howSteps.map((step, index) => (
                <li key={step.title} className="lx-card lx-reveal p-6">
                  <span className="lx-gradient-text text-5xl font-black">{digits(String(index + 1).padStart(2, "0"))}</span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="lx-muted mt-2 text-sm leading-7">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------ why us */}
        <section id="why-us" className="scroll-mt-20 border-y border-border/60 bg-surface/50 py-20 md:py-28">
          <div className="lx-container">
            <SectionHeading eyebrow={t("landingUi.whyEyebrow")} title={landingWhyTitle(t)} />
            <div className={`mt-14 grid gap-4 ${gridCols(content.whyUs.length)}`}>
              {content.whyUs.map((item, index) => (
                <div key={item.title} className="lx-card lx-reveal p-6">
                  <span className="lx-icon" data-accent={ACCENTS[index % ACCENTS.length]}>
                    {[<ShieldTick key="a" size={22} variant="Bold" />, <Calendar key="b" size={22} variant="Bold" />, <Chart key="c" size={22} variant="Bold" />, <Mobile key="d" size={22} variant="Bold" />][index % 4]}
                  </span>
                  <h3 className="mt-5 font-bold">{item.title}</h3>
                  <p className="lx-muted mt-2 text-sm leading-7">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ pricing */}
        <section id="pricing" className="scroll-mt-20 py-20 md:py-28">
          <div className="lx-container">
            <SectionHeading eyebrow={t("landingUi.pricingEyebrow")} title={t("landingUi.pricingTitle")} subtitle={t("landingUi.pricingSubtitle")} />
            <div className={`mx-auto mt-14 grid max-w-5xl gap-5 ${plans.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={`lx-card lx-reveal flex flex-col p-7 ${plan.highlighted ? "border-[color-mix(in_oklch,var(--lx-rose)_45%,transparent)] shadow-2xl shadow-rose-500/10" : ""}`}
                >
                  {plan.highlighted ? (
                    <span className="absolute -top-3 start-7 rounded-full bg-gradient-to-l from-rose-500 to-violet-500 px-3 py-1 text-xs font-bold text-white">
                      {t("landingUi.popular")}
                    </span>
                  ) : null}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="lx-muted mt-1 min-h-12 text-sm leading-6">{plan.description}</p>
                  <p className="mt-5 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    {plan.period ? <span className="lx-muted text-sm">/ {plan.period}</span> : null}
                  </p>
                  <ul className="my-6 flex-1 space-y-2.5 border-t border-border/60 pt-5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm">
                        <TickCircle size={18} className="shrink-0 text-[var(--lx-teal)]" variant="Bold" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={isAuth ? PATHS.PLANS : PATHS.GET_STARTED} className={`lx-btn w-full ${plan.highlighted ? "lx-btn-primary" : "lx-btn-ghost"}`}>
                    {isAuth ? t("landingUi.choose") : t("landingUi.start")}
                  </Link>
                  {plan.paid ? (
                    <p className="lx-muted mt-3 text-center text-xs">
                      {t("common.subscription.onlinePaymentSoon")}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-border/60 bg-surface/50 py-20 md:py-28">
          <div className="lx-container">
            <SectionHeading eyebrow={t("landingUi.faqEyebrow")} title={t("landingUi.faqTitle")} />
            <div className="mx-auto mt-12 max-w-3xl space-y-3">
              {content.faq.map((item, index) => (
                <details key={item.q} className="lx-faq lx-card group p-0" open={index === 0}>
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 text-start font-semibold">
                    {item.q}
                    <span className="lx-faq-icon flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-secondary">
                      <Add size={18} />
                    </span>
                  </summary>
                  <p className="lx-muted px-5 pb-5 text-sm leading-8">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ CTA */}
        <section className="py-20 md:py-24">
          <div className="lx-container">
            <div className="lx-cta lx-reveal relative overflow-hidden px-6 py-14 text-center md:px-16 md:py-20">
              <h2 className="lx-h2 mx-auto max-w-2xl">{t("landingUi.ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-8 opacity-90 md:text-lg">{t("landingUi.ctaBody")}</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={primaryHref} className="lx-btn w-full bg-white text-rose-600 shadow-xl hover:-translate-y-0.5 sm:w-auto">
                  {primaryLabel}
                  <ArrowLeft size={18} />
                </Link>
                {showDownload ? (
                  <Link href={PATHS.DOWNLOAD} className="lx-btn w-full border border-white/40 bg-white/10 text-white hover:bg-white/20 sm:w-auto">
                    <DocumentDownload size={18} />
                    {t("landingUi.downloadApp")}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ about + contact */}
        <section id="contact" className="scroll-mt-20 pb-20 md:pb-28">
          <div className="lx-container grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <div id="about" className="lx-card lx-reveal scroll-mt-20 p-7">
              <span className="lx-eyebrow">{t("landingUi.contactEyebrow")}</span>
              <h2 className="mt-4 text-2xl font-extrabold">{content.contact.title}</h2>
              <p className="lx-muted mt-3 text-sm leading-7">{content.contact.description}</p>
              <ul className="mt-6 space-y-3">
                {[
                  content.contact.email ? { label: contactLabels.email, value: content.contact.email, href: `mailto:${content.contact.email}`, icon: Sms } : null,
                  content.contact.telegram ? { label: contactLabels.telegram, value: `@${content.contact.telegram}`, href: `https://t.me/${content.contact.telegram}`, icon: Messages2 } : null,
                  content.contact.phone ? { label: contactLabels.phone, value: digits(content.contact.phone), href: `tel:${content.contact.phone}`, icon: Call } : null,
                ]
                  .filter(Boolean)
                  .map((item) => {
                    const entry = item as { label: string; value: string; href: string; icon: typeof Sms };
                    const Icon = entry.icon;
                    return (
                      <li key={entry.label}>
                        <a href={entry.href} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3 transition hover:border-[color-mix(in_oklch,var(--lx-rose)_40%,transparent)]" target={entry.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                          <span className="lx-icon !size-10" data-accent="rose">
                            <Icon size={18} variant="Bold" />
                          </span>
                          <span>
                            <span className="lx-muted block text-xs">{entry.label}</span>
                            <span className="text-sm font-semibold" dir="ltr">
                              {entry.value}
                            </span>
                          </span>
                        </a>
                      </li>
                    );
                  })}
              </ul>
              {content.about.paragraphs?.length ? (
                <div className="mt-6 border-t border-border/60 pt-5">
                  <h3 className="font-bold">{content.about.title}</h3>
                  {content.about.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="lx-muted mt-2 text-sm leading-7">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="lx-card lx-reveal p-7">
              <LandingContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------ footer */}
      <footer className="border-t border-border/60 bg-surface/60">
        <div className="lx-container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <AppLogo size={34} showText={false} />
              <span className="text-lg font-extrabold">{content.hero.title}</span>
            </div>
            <p className="lx-muted mt-3 max-w-sm text-sm leading-7">{content.hero.tagline}</p>
          </div>
          <div>
            <p className="text-sm font-bold">{t("landingUi.product")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="lx-muted hover:text-foreground">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link href={PATHS.PRICING} className="lx-muted hover:text-foreground">
                  {content.pricing.title || t("landingUi.pricingEyebrow")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold">{t("landingUi.support")}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href={PATHS.GET_STARTED} className="lx-muted hover:text-foreground">
                  {t("landingUi.login")}
                </Link>
              </li>
              {showDownload ? (
                <li>
                  <Link href={PATHS.DOWNLOAD} className="lx-muted hover:text-foreground">
                    {t("landingUi.downloadApp")}
                  </Link>
                </li>
              ) : null}
              <li>
                <a href="#contact" className="lx-muted hover:text-foreground">
                  {t("landingUi.contactEyebrow")}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/60">
          <div className="lx-container flex flex-col items-center justify-between gap-3 py-5 text-xs sm:flex-row">
            <p className="lx-muted">
              © {digits(String(new Date().getFullYear()))} {content.hero.title} — {t("landingUi.rights")}
            </p>
            <SiteFooterCredits />
          </div>
        </div>
      </footer>
    </div>
  );
}
