"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Add,
  ArrowLeft,
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
import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";
import type { CSSProperties } from "react";
import { landingContactLabels, landingWhyTitle } from "@/i18n/localize-landing-content";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { LandingContactForm } from "./LandingContactForm";
import { BentoShowcase, CompareSection, PersonaSection, SavingsSimulator, SecuritySection } from "./LandingSections";
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

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * One scroll listener drives every 3D scene: `[data-scene]` gets `--p` (0→1
 * through the scene), `[data-rise]` gets `--e` (0→1 as it enters), and
 * `[data-steps]` toggles `data-on` on its `[data-k]` children.
 */
function useScrollScenes() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-scene]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const total = rect.height - vh;
        const p = reduce ? 0.5 : total > 40 ? clamp01(-rect.top / total) : clamp01((vh - rect.top) / (vh + rect.height));
        el.style.setProperty("--p", p.toFixed(4));
        const count = Number(el.dataset.steps ?? 0);
        if (count) {
          const active = Math.min(count - 1, Math.floor(p * count));
          el.querySelectorAll<HTMLElement>("[data-k]").forEach((child) => {
            child.dataset.on = String(Number(child.dataset.k) === active);
          });
        }
      });
      document.querySelectorAll<HTMLElement>("[data-rise]").forEach((el) => {
        const rect = el.getBoundingClientRect();
        const e = reduce ? 1 : clamp01((vh * 0.96 - rect.top) / (vh * 0.45));
        el.style.setProperty("--e", e.toFixed(3));
      });
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const timer = window.setTimeout(update, 400); // content (plans, CMS) may change heights
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.clearTimeout(timer);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
}

/** Cursor-reactive parallax for a scene (desktop pointers only). */
function pointerParallax(event: React.PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx", ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
  event.currentTarget.style.setProperty("--my", ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
}

function cardGlow(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx2", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--my2", `${event.clientY - rect.top}px`);
}

/** Pulls a button slightly toward the cursor. */
function magnet(event: React.PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - (rect.left + rect.width / 2)) * 0.25;
  const y = (event.clientY - (rect.top + rect.height / 2)) * 0.35;
  event.currentTarget.style.transform = `translate(${x}px, ${y}px)`;
}
function unmagnet(event: React.PointerEvent<HTMLElement>) {
  event.currentTarget.style.transform = "";
}

function Words({ text, from = 0 }: { text: string; from?: number }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`} className="l3-word" style={{ ["--w" as string]: from + index } as CSSProperties}>
          {word}&nbsp;
        </span>
      ))}
    </>
  );
}

/** The exploded dashboard that separates into floating layers as you scroll. */
function HeroStack() {
  const { t, language } = useTranslation();
  const digits = (value: string) => formatLocalizedDigits(value, language);
  const bars = [42, 66, 38, 80, 54, 92, 70, 58];
  const rows = [
    { label: t("landingUi.mockTx1"), amount: "+45,000,000", income: true },
    { label: t("landingUi.mockTx2"), amount: "−1,240,000", income: false },
    { label: t("landingUi.mockTx3"), amount: "−4,200,000", income: false },
  ];
  const circumference = 2 * Math.PI * 44;
  return (
    <div className="l3-stackwrap" aria-hidden>
      <div className="l3-stack">
        <div className="l3-layer l3-g l3-frame" />
        <div className="l3-layer l3-g l3-balance">
          <p>{t("landingUi.mockBalance")}</p>
          <strong>
            <AnimatedNumber from={0} value={53140000} durationMs={2200} format={(n) => digits(n.toLocaleString("en-US"))} />
          </strong>
        </div>
        <div className="l3-layer l3-g l3-chart">
          {bars.map((height, index) => (
            <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }} />
          ))}
        </div>
        <div className="l3-layer l3-g l3-list">
          {rows.map((row) => (
            <div key={row.label} className="l3-row">
              <span>{row.label}</span>
              <b className={row.income ? "l3-in" : "l3-out"} dir="ltr">
                {digits(row.amount)}
              </b>
            </div>
          ))}
        </div>
        <div className="l3-layer l3-g l3-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="9" />
            <circle cx="50" cy="50" r="44" fill="none" stroke="#2dd4bf" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * 0.24} />
          </svg>
          <span>{digits("۷۶")}</span>
        </div>
        <div className="l3-layer l3-g l3-chip l3-chip-a">
          <span className="lx-icon !size-8 shrink-0 !rounded-lg" data-accent="violet">
            <Notification size={16} variant="Bold" />
          </span>
          <span>{t("landingUi.mockReminder")}</span>
        </div>
        <span className="l3-layer l3-coin l3-coin-a" aria-hidden>$</span>
        <span className="l3-layer l3-coin l3-coin-b" aria-hidden>₮</span>
        <span className="l3-layer l3-coin l3-coin-c" aria-hidden />
        <div className="l3-layer l3-g l3-chip l3-chip-b">
          <span className="lx-icon !size-8 shrink-0 !rounded-lg" data-accent="teal">
            <Profile2User size={16} variant="Bold" />
          </span>
          <span>{t("landingUi.mockDebt")}</span>
        </div>
      </div>
    </div>
  );
}

/** Four phone screens that cross-fade as the story scrolls. */
function StoryScreens() {
  const { t, language } = useTranslation();
  const digits = (value: string) => formatLocalizedDigits(value, language);
  const bars = [42, 66, 38, 80, 54, 92, 70];
  const labels = [t("landingUi.mockTx1"), t("landingUi.mockTx2"), t("landingUi.mockTx3"), t("landingUi.mockTx4")];
  const colors = ["#fb7185", "#a78bfa", "#2dd4bf", "#fbbf24"];
  const circumference = 2 * Math.PI * 40;
  let offset = 0;
  const shares = [0.38, 0.27, 0.21, 0.14];
  return (
    <>
      <div className="l3-screen" data-k="0">
        <div className="l3-g" style={{ background: "linear-gradient(135deg,#fb7185,#a855f7)", border: 0 }}>
          <p style={{ opacity: 0.85 }}>{t("landingUi.mockBalance")}</p>
          <p className="mt-1 text-xl font-extrabold">{digits("53,140,000")}</p>
        </div>
        <div className="l3-g flex h-28 items-end gap-1.5">
          {bars.map((height, i) => (
            <i key={i} className="flex-1 rounded-md" style={{ height: `${height}%`, background: i % 2 ? "#fb7185" : "#2dd4bf" }} />
          ))}
        </div>
        {labels.slice(0, 3).map((label, i) => (
          <div key={label} className="l3-g l3-row">
            <span>{label}</span>
            <b className={i % 2 ? "l3-out" : "l3-in"} dir="ltr">{digits(i % 2 ? "−1,240,000" : "+45,000,000")}</b>
          </div>
        ))}
      </div>

      <div className="l3-screen" data-k="1">
        {labels.map((label, i) => (
          <div key={label} className="l3-g">
            <div className="l3-row !bg-transparent !p-0">
              <span className="font-semibold">{label}</span>
              <b dir="ltr">{digits(`${(i + 2) * 2},500,000`)}</b>
            </div>
            <div className="l3-pbar"><i style={{ width: `${30 + i * 20}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="l3-screen" data-k="2">
        <div className="l3-g text-center">
          <svg viewBox="0 0 100 100" className="l3-donut -rotate-90">
            {shares.map((share, i) => {
              const dash = share * circumference;
              const circle = (
                <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={colors[i]} strokeWidth="14" strokeDasharray={`${dash - 2} ${circumference}`} strokeDashoffset={-offset} />
              );
              offset += dash;
              return circle;
            })}
          </svg>
          <p className="text-lg font-extrabold">{digits("۹۲")}<span className="text-xs opacity-60"> / {digits("۱۰۰")}</span></p>
        </div>
        {labels.map((label, i) => (
          <div key={label} className="l3-row">
            <span className="flex items-center gap-2"><i className="size-2.5 rounded-full" style={{ background: colors[i] }} />{label}</span>
            <b>{digits(`${Math.round(shares[i] * 100)}%`)}</b>
          </div>
        ))}
      </div>

      <div className="l3-screen" data-k="3">
        <div className="l3-g">
          <div className="l3-avatars">
            {["#fb7185", "#a78bfa", "#2dd4bf"].map((c, i) => (
              <span key={c} style={{ background: c }}>{["A", "B", "C"][i]}</span>
            ))}
          </div>
          <p className="mt-2 font-semibold">{t("landingUi.mockDebt")}</p>
        </div>
        {[0.5, 0.3, 0.2].map((share, i) => (
          <div key={share} className="l3-g">
            <div className="l3-row !bg-transparent !p-0"><span>{["A", "B", "C"][i]}</span><b>{digits(`${share * 100}%`)}</b></div>
            <div className="l3-pbar"><i style={{ width: `${share * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </>
  );
}

function PhoneDevice({ children }: { children: React.ReactNode }) {
  return (
    <div className="l3-device-wrap" aria-hidden>
      <div className="l3-device">
        <div className="l3-phone">
          <span className="l3-notch" />
          <div className="l3-screen-area">{children}</div>
        </div>
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
  useScrollScenes();

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
        <span className="lx-progress" aria-hidden />
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
        {/* ------------------------------------------------ hero: exploding 3D dashboard */}
        <section className="l3-hero" data-scene onPointerMove={pointerParallax}>
          <div className="l3-sticky">
            <div className="l3-aurora"><span className="l3-orb l3-orb-a" /><span className="l3-orb l3-orb-b" /><span className="l3-orb l3-orb-c" /></div>
            <div className="l3-floor" aria-hidden />
            <div className="lx-container l3-hero-grid">
              <div className="l3-hero-copy text-center lg:text-start">
                <span className="lx-eyebrow lx-enter" style={{ ["--d" as string]: 0 }}>
                  <span className="size-2 rounded-full bg-[var(--lx-rose)]" />
                  {content.hero.badge || t("landingUi.heroEyebrow")}
                </span>
                <h1 className="lx-h1 mt-6">
                  <Words text={content.hero.title} />
                  <span className="lx-gradient-text mt-2 block pb-1">
                    <Words text={content.hero.tagline} from={content.hero.title.split(" ").length} />
                  </span>
                </h1>
                <p className="lx-muted lx-enter mx-auto mt-6 max-w-xl text-base leading-8 md:text-lg lg:mx-0" style={{ ["--d" as string]: 3 }}>{content.hero.description}</p>
                <div className="lx-enter mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start" style={{ ["--d" as string]: 4 }}>
                  <Link href={primaryHref} className="lx-btn lx-btn-primary l3-magnet w-full sm:w-auto" onPointerMove={magnet} onPointerLeave={unmagnet}>
                    {primaryLabel}
                    <ArrowLeft size={18} />
                  </Link>
                  <a href="#how" className="lx-btn lx-btn-ghost w-full sm:w-auto">
                    {content.hero.secondaryCta}
                  </a>
                </div>
                <p className="lx-muted lx-enter mt-4 text-xs" style={{ ["--d" as string]: 5 }}>{t("landingUi.heroNote")}</p>
              </div>
              <HeroStack />
            </div>
            <div className="l3-scrollhint" aria-hidden>
              <i />
              {t("landingUi.scrollHint")}
            </div>
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

        {/* ------------------------------------------------ story: pinned phone that rotates through the steps */}
        <section id="how" className="l3-stage l3-story scroll-mt-0" data-scene data-steps={content.howSteps.length} style={{ ["--steps" as string]: content.howSteps.length } as CSSProperties}>
          <div className="l3-aurora"><span className="l3-orb l3-orb-a" /><span className="l3-orb l3-orb-b" /></div>
          <div className="l3-sticky">
            <div className="lx-container l3-story-grid">
              <div>
                <span className="lx-eyebrow">{t("landingUi.howEyebrow")}</span>
                <h2 className="lx-h2 mt-4 mb-6">{t("landingUi.howTitle")}</h2>
                <ol className="l3-steps">
                  {content.howSteps.map((step, index) => (
                    <li key={step.title} className="l3-step" data-k={index} data-on={index === 0 ? "true" : "false"}>
                      <span className="l3-step-n">{digits(String(index + 1))}</span>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </li>
                  ))}
                </ol>
                <div className="l3-progress" aria-hidden><i /></div>
              </div>
              <PhoneDevice>
                <StoryScreens />
              </PhoneDevice>
            </div>
          </div>
        </section>

        <BentoShowcase />

        {/* ------------------------------------------------ features: cards fly in from depth */}
        <section id="features" className="relative scroll-mt-20 py-20 md:py-28">
          <div className="lx-container">
            <SectionHeading eyebrow={t("landingUi.featuresEyebrow")} title={t("landingUi.featuresTitle")} subtitle={t("landingUi.featuresSubtitle")} />
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" >
              {content.features.map((feature, index) => {
                const Icon = FEATURE_ICONS[feature.id] ?? Wallet2;
                const accent = feature.accent ?? ACCENTS[index % ACCENTS.length];
                const remainder = content.features.length % 3;
                const wide =
                  (remainder === 2 && index === 0) ||
                  (remainder === 1 && (index === 0 || index === content.features.length - 1));
                return (
                  <article key={feature.id} data-rise className={`l3-card ${wide ? "lg:col-span-2" : ""}`} onPointerMove={cardGlow}>
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

        {/* ------------------------------------------------ big type + numbers */}
        <section className="border-y border-border/60 py-12 md:py-16" data-scene aria-label={content.hero.title}>
          <div className="l3-bigtext" aria-hidden>
            <span>{content.hero.title} · {content.hero.title} · {content.hero.title}</span>
          </div>
          <div className="lx-container">
            <dl className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
              {content.stats.map((stat) => (
                <div key={stat.label} className="l3-stat" data-rise>
                  <dd>{stat.value}</dd>
                  <dt className="lx-muted mt-1 text-sm">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <PersonaSection />

        <SavingsSimulator href={isAuth ? PATHS.BOXES : PATHS.GET_STARTED} />

        {/* ------------------------------------------------ telegram: chat plays as you scroll */}
        <section className="l3-stage l3-chatscene" data-scene>
          <div className="l3-aurora"><span className="l3-orb l3-orb-a" /><span className="l3-orb l3-orb-c" /></div>
          <div className="l3-sticky">
            <div className="lx-container l3-chat-grid">
              <div>
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
              <div className="l3-tg" aria-hidden>
                <div className="l3-g l3-tg-card">
                  <div className="l3-tg-head">
                    <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white">
                      <Send2 size={20} variant="Bold" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Paradise Desk Bot</p>
                      <p className="text-[11px] text-sky-400">online</p>
                    </div>
                  </div>
                  <div className="l3-tg-body">
                    <div className="l3-msg l3-msg-me" style={{ ["--at" as string]: 0.12 } as CSSProperties}>{t("landingUi.chatUser")}</div>
                    <div className="l3-msg l3-msg-bot" style={{ ["--at" as string]: 0.35 } as CSSProperties}>{t("landingUi.chatBot")}</div>
                    <div className="l3-msg l3-msg-bot" style={{ ["--at" as string]: 0.6 } as CSSProperties}>{t("landingUi.chatReminder")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CompareSection />

        <SecuritySection />

        {/* ------------------------------------------------ why us */}
        <section id="why-us" className="scroll-mt-20 py-20 md:py-28">
          <div className="lx-container">
            <SectionHeading eyebrow={t("landingUi.whyEyebrow")} title={landingWhyTitle(t)} />
            <div className={`mt-14 grid gap-4 ${gridCols(content.whyUs.length)}`}>
              {content.whyUs.map((item, index) => (
                <div key={item.title} data-rise className="l3-card" onPointerMove={cardGlow}>
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
                  data-rise
                  onPointerMove={cardGlow}
                  className={`l3-card flex flex-col !p-7 ${plan.highlighted ? "border-[color-mix(in_oklch,var(--lx-rose)_45%,transparent)] shadow-2xl shadow-rose-500/10" : ""}`}
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
            <div className="l3-cta" data-rise>
              <h2 className="lx-h2 mx-auto max-w-2xl">{t("landingUi.ctaTitle")}</h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-8 opacity-90 md:text-lg">{t("landingUi.ctaBody")}</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href={primaryHref} className="lx-btn l3-magnet w-full bg-white text-rose-600 shadow-xl sm:w-auto" onPointerMove={magnet} onPointerLeave={unmagnet}>
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
