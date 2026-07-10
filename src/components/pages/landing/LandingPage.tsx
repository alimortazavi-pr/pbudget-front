"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { Button, Input, Label, TextArea, TextField } from "@heroui/react";
import {
  ArrowLeft2,
  Building,
  Calendar,
  Call,
  Chart,
  Clock,
  DirectboxSend,
  DocumentDownload,
  Menu,
  Messages2,
  Microphone2,
  Profile2User,
  ShieldTick,
  Sms,
  TickCircle,
  Wallet2,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { useAndroidAppAvailability } from "@/common/hooks/useAndroidAppAvailability";
import { APP_NAME_EN } from "@/common/constants/brand";
import { useBrandLabels } from "@/common/hooks/useBrandLabels";
import type { ILandingContent, LandingAccent } from "@/common/interfaces/landing.interface";
import { submitSiteContact } from "@/common/api/site";
import { toEnglishDigits, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LanguageSelector } from "@/components/common/layout/LanguageSelector";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { SiteFooterCredits } from "@/components/common/brand/SiteFooterCredits";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { ProductFamilyBanner } from "./ProductFamilyBanner";
import { LandingParticles } from "./LandingParticles";
import { LandingPricingSection } from "./LandingPricingSection";
import { useLandingContent } from "./useLandingContent";
import { useMouseParallax, useScrollProgress, useScrollReveal } from "./landing-effects";
import {
  landingContactLabels,
  landingDashboardCta,
  landingWhyTitle,
} from "@/i18n/localize-landing-content";
import { formatLocalizedDigits } from "@/i18n/format-localized-digits";

const ACCENT: Record<LandingAccent, string> = {
  rose: "from-rose-500/15 to-rose-500/5 border-rose-500/25",
  teal: "from-teal-500/15 to-teal-500/5 border-teal-500/25",
  violet: "from-violet-500/15 to-violet-500/5 border-violet-500/25",
};

const FEATURE_ICONS: Record<string, typeof Wallet2> = {
  finance: Wallet2,
  boxes: Wallet2,
  bank: DocumentDownload,
  categories: Chart,
  debts: Clock,
  planning: Calendar,
  projects: Building,
  ventures: Profile2User,
  voice: Microphone2,
  analysis: Chart,
};

const FEATURE_ICON_BG: Record<LandingAccent, string> = {
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  teal: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** آخرین کارت اگر در ردیف تنها بماند، کل عرض گرید را می‌گیرد */
function featureGridItemClass(index: number, total: number) {
  const isLast = index === total - 1;
  if (!isLast) return "";

  const classes: string[] = [];
  if (total % 2 === 1) classes.push("sm:col-span-2");
  if (total % 3 === 1) classes.push("lg:col-span-3");
  return classes.join(" ");
}

function featureCardIsOrphanFullWidth(index: number, total: number) {
  return index === total - 1 && total % 3 === 1;
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`landing-reveal ${visible ? "is-visible" : ""} ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

function Product3D() {  const { t } = useTranslation();

  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({ rx: ((e.clientY - r.top) / r.height - 0.5) * -10, ry: ((e.clientX - r.left) / r.width - 0.5) * 10 });
  }, []);

  return (
    <div
      ref={stageRef}
      className="landing-3d-stage landing-app-preview relative mx-auto w-full max-w-md lg:max-w-none"
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
    >
      <div
        className="landing-3d-card lp-card relative overflow-hidden rounded-[1.75rem] backdrop-blur-xl"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        <div className="flex items-center gap-1.5 border-b lp-border px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-rose-400/90" />
          <span className="size-2.5 rounded-full bg-amber-400/90" />
          <span className="size-2.5 rounded-full bg-emerald-400/90" />
          <span className="mx-auto text-[10px] lp-muted" dir="ltr">
            pdesk.ir/app
          </span>
        </div>
        <div className="flex min-h-[15rem]">
          <div className="flex w-10 shrink-0 flex-col items-center gap-2 border-e lp-border py-3">
            {[Wallet2, Calendar, Chart, DocumentDownload].map((Icon, i) => (
              <span
                key={i}
                className={`flex size-6 items-center justify-center rounded-md ${i === 0 ? "bg-[color-mix(in_oklch,var(--brand-rose)_18%,transparent)] text-[var(--brand-rose-deep)]" : "lp-muted"}`}
              >
                <Icon size={14} variant={i === 0 ? "Bold" : "Linear"} />
              </span>
            ))}
          </div>
          <div className="flex-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold">{t("auto.kbc3d6cfc08")}</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                امروز
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {[{ l: "درآمد", v: "۱۲.۸M" }, { l: "هزینه", v: "۴.۲M" }, { l: "مانده", v: "۸.۶M" }].map((s) => (
                <div key={s.l} className="rounded-lg bg-[var(--lp-card)] p-2">
                  <p className="text-[10px] lp-muted">{s.l}</p>
                  <p className="font-bold">{toPersianDigits(s.v)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex h-20 items-end gap-1 rounded-lg bg-[var(--lp-card)] p-2">
              {[40, 70, 50, 90, 60, 85, 75].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[var(--brand-rose)] to-[var(--brand-violet)]" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {["خرید هفتگی", "حقوق پروژه", "اشتراک ابری"].map((row, i) => (
                <div key={row} className="flex items-center justify-between rounded-lg bg-[var(--lp-card)] px-2.5 py-1.5 text-[11px]">
                  <span className="lp-muted">{row}</span>
                  <span className={`font-semibold ${i === 1 ? "text-[var(--brand-teal-deep)]" : ""}`}>
                    {toPersianDigits(i === 1 ? "+۲.۴M" : "-۸۵۰K")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="landing-float-badge absolute -left-2 top-12 z-10 lp-card rounded-xl px-3 py-2 backdrop-blur-xl md:-left-4 md:top-14">
        <div className="flex items-center gap-2 text-xs font-medium md:text-sm">
          <Chart size={18} className="text-[var(--brand-rose)]" />
          بودجه ماهانه
        </div>
      </div>
      <div className="landing-float-badge landing-float-badge-2 absolute -right-1 bottom-6 z-10 lp-card rounded-xl px-3 py-2 backdrop-blur-xl md:-right-2 md:bottom-8">
        <div className="flex items-center gap-2 text-xs font-medium">
          <TickCircle size={16} className="text-emerald-500" variant="Bold" />
          تراکنش ثبت شد
        </div>
      </div>
    </div>
  );
}

function ContactForm() {  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateForm() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "نام الزامی است";

    const phoneNorm = toEnglishDigits(phone.trim());
    if (phoneNorm && !/^09\d{9}$/.test(phoneNorm)) {
      next.phone = "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸۹)";
    }

    const emailTrim = email.trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      next.email = "ایمیل معتبر نیست";
    }

    if (message.trim().length < 10) {
      next.message = "پیام باید حداقل ۱۰ کاراکتر باشد";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setSending(true);
    try {
      const res = await submitSiteContact({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: toEnglishDigits(phone.trim()) || undefined,
        message: message.trim(),
      });
      showToast(res.message, "success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setErrors({});
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ارسال ناموفق");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-5 sm:grid-cols-2">
      <TextField className="gap-2" isInvalid={Boolean(errors.name)}>
        <Label className="text-sm font-medium">{t("common.name")}</Label>
        <Input
          variant="secondary"
          className="w-full"
          value={name}
          onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
          required
        />
        {errors.name ? <span className="text-sm text-danger">{errors.name}</span> : null}
      </TextField>
      <TextField className="gap-2" isInvalid={Boolean(errors.phone)}>
        <Label className="text-sm font-medium">{t("auto.kc771d04490")}</Label>
        <Input
          type="tel"
          inputMode="tel"
          variant="secondary"
          className="w-full"
          placeholder={t("auto.k31b5be1e8a")}
          value={phone}
          onChange={(e) => { setPhone(e.target.value); setErrors((prev) => ({ ...prev, phone: "" })); }}
        />
        {errors.phone ? <span className="text-sm text-danger">{errors.phone}</span> : null}
      </TextField>
      <TextField className="gap-2 sm:col-span-2" isInvalid={Boolean(errors.email)}>
        <Label className="text-sm font-medium">{t("auto.kc7df355066")}</Label>
        <Input
          type="email"
          variant="secondary"
          className="w-full"
          dir="ltr"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: "" })); }}
        />
        {errors.email ? <span className="text-sm text-danger">{errors.email}</span> : null}
      </TextField>
      <TextField className="gap-2 sm:col-span-2" isInvalid={Boolean(errors.message)}>
        <Label className="text-sm font-medium">{t("auto.k69b7c72077")}</Label>
        <TextArea
          variant="secondary"
          className="w-full min-h-[9rem] resize-y"
          rows={5}
          value={message}
          onChange={(e) => { setMessage(e.target.value); setErrors((prev) => ({ ...prev, message: "" })); }}
          required
        />
        {errors.message ? <span className="text-sm text-danger">{errors.message}</span> : null}
      </TextField>
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" isDisabled={sending}>
          <DirectboxSend size={18} />
          {sending ? "در حال ارسال…" : "ارسال پیام"}
        </Button>
      </div>
    </form>
  );
}

function FaqList({ items }: { items: ILandingContent["faq"] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.q} data-open={open === i} className="landing-faq-item lp-card rounded-xl">
          <button type="button" className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start font-medium" onClick={() => setOpen(open === i ? null : i)}>
            {item.q}
            <span className="text-xl text-[var(--brand-rose)]" style={{ transform: open === i ? "rotate(45deg)" : "none" }}>+</span>
          </button>
          <div className="landing-faq-body"><div><p className="px-4 pb-3.5 text-sm lp-muted leading-relaxed">{item.a}</p></div></div>
        </div>
      ))}
    </div>
  );
}

export function LandingPage({ initialContent }: { initialContent?: ILandingContent }) {
  const { t, language } = useTranslation();
  const { tagline } = useBrandLabels();
  const { content } = useLandingContent(initialContent);
  const isAuth = useAppSelector(isAuthSelector);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollProgress = useScrollProgress();
  const parallax = useMouseParallax(12);
  const heroRef = useRef<HTMLElement>(null);
  const contactLabels = landingContactLabels(t);

  const primaryCta = isAuth ? PATHS.HOME : PATHS.GET_STARTED;
  const primaryLabel = isAuth ? landingDashboardCta(t) : content.hero.primaryCta;
  const appSoon = content.settings.downloadComingSoon;
  const { apkAvailable } = useAndroidAppAvailability();
  const showAppDownload = !appSoon;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
      hero.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    };
    hero.addEventListener("mousemove", onMove, { passive: true });
    return () => hero.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="landing-page min-h-screen">
      <div className="landing-scroll-progress" style={{ transform: `scaleX(${scrollProgress})` }} />

      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? "lp-nav-scrolled" : ""}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link href={PATHS.LANDING} className="flex items-center gap-2.5 font-bold">
            <AppLogo size={44} showText={false} />
            <span className="hidden text-sm sm:block">{content.hero.title}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {content.nav.map((item) => (
              <button key={item.id} type="button" onClick={() => scrollToId(item.id)} className="landing-nav-link rounded-lg px-3 py-2 text-sm lp-muted hover:text-[var(--lp-text)]">
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <LanguageSelector />
            <ThemeToggle />
            <ProductFamilyBanner variant="header" />
            {showAppDownload ? (
                <Link href={PATHS.DOWNLOAD} className="hidden sm:block">
                  <Button variant="ghost" size="sm"><DocumentDownload size={18} />{t("nav.downloadApp")}</Button>
                </Link>
            ) : null}
            <Link href={primaryCta}>
              <Button size="sm">{primaryLabel}<ArrowLeft2 size={16} /></Button>
            </Link>
            <Button isIconOnly variant="ghost" size="sm" className="lg:hidden" onPress={() => setMenuOpen((v) => !v)}><Menu size={22} /></Button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="border-t lp-border bg-[var(--lp-bg-elevated)] px-4 py-2 lg:hidden">
            {content.nav.map((item) => (
              <button key={item.id} type="button" className="block w-full rounded-lg px-3 py-2.5 text-start text-sm" onClick={() => { setMenuOpen(false); scrollToId(item.id); }}>{item.label}</button>
            ))}
            {showAppDownload ? (
              <Link
                href={PATHS.DOWNLOAD}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-accent"
                onClick={() => setMenuOpen(false)}
              >
                {t("nav.downloadApp")}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </header>

      <section ref={heroRef} className="landing-spotlight landing-noise relative overflow-hidden pt-28 pb-10 md:pt-32 md:pb-14 lg:pt-36 lg:pb-16">
        <LandingParticles />
        <div className="landing-aurora landing-aurora-1" style={{ transform: `translate(${parallax.x * 10}px, ${parallax.y * 6}px)` }} />
        <div className="landing-aurora landing-aurora-2" style={{ transform: `translate(${parallax.x * -8}px, ${parallax.y * -5}px)` }} />
        <div className="landing-aurora landing-aurora-3" style={{ transform: `translate(${parallax.x * 6}px, ${parallax.y * -4}px)` }} />
        <div className="landing-grid-3d pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 md:gap-10 md:px-6 lg:grid-cols-2 lg:gap-12 xl:max-w-7xl">
          <div className="order-2 lg:order-1">
            <p className="landing-hero-enter landing-hero-enter-d1 mb-4 inline-flex items-center gap-2 rounded-full lp-card px-3 py-1.5 text-xs font-medium backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-500" />
              {content.hero.badge}
            </p>
            <motion.h1
              className="landing-hero-enter landing-hero-enter-d2 font-sans text-3xl font-bold leading-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.15]"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              {content.hero.title}
              <span className="landing-text-shimmer mt-2 block text-2xl md:text-3xl lg:text-4xl">{content.hero.tagline}</span>
            </motion.h1>
            <p className="landing-hero-enter landing-hero-enter-d3 mt-4 max-w-xl text-base leading-relaxed lp-muted md:mt-5 md:text-lg">{content.hero.description}</p>
            <div className="landing-hero-enter landing-hero-enter-d4 mt-6 flex flex-wrap gap-3 md:mt-8">
              <Link href={primaryCta}><Button size="lg">{primaryLabel}<ArrowLeft2 size={18} /></Button></Link>
              {showAppDownload ? (
                <Link href={PATHS.DOWNLOAD}>
                  <Button size="lg" variant="secondary">
                    <DocumentDownload size={18} />
                    {apkAvailable ? t("common.download") : t("nav.downloadApp")}
                  </Button>
                </Link>
              ) : null}
              <Button size="lg" variant="secondary" onPress={() => scrollToId("features")}>{content.hero.secondaryCta}</Button>
            </div>
            <div className="landing-hero-enter landing-hero-enter-d5 landing-hero-stats landing-hero-stats--inline">
              {content.stats.map((stat) => (
                <div key={stat.label} className="landing-hero-stat">
                  <p className={`landing-stat-glow text-xl font-bold md:text-2xl ${/[A-Za-z]/.test(stat.value) ? "landing-stat-glow--latin" : ""}`}>
                    {toPersianDigits(stat.value)}
                  </p>
                  <p className="mt-1 text-xs font-medium lp-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="landing-hero-enter landing-hero-enter-d3 landing-hero-visual order-1 lg:order-2">
            <Product3D />
          </div>
        </div>
      </section>

      <div className="border-y lp-border overflow-hidden py-4">
        <div className="landing-marquee-track gap-10 px-6">
          {[...content.marquee, ...content.marquee].map((label, i) => (
            <span key={`${label}-${i}`} className="shrink-0 text-sm font-medium lp-muted">{label}</span>
          ))}
        </div>
      </div>

      <section id="features" className="scroll-mt-24 py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold md:text-4xl">{t("auto.kd4caaca0fc")}<span className="landing-text-shimmer">{t("auto.kce39b11865")}</span></h2>
            <p className="mt-3 text-sm lp-muted md:text-base">
              همه ابزارهای مالی شخصی در یک میز — از تراکنش روزانه تا پروژه و تحلیل.
            </p>
          </Reveal>
          <div className="landing-features-grid mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.features.map((f, i) => {
              const Icon = FEATURE_ICONS[f.id] ?? Wallet2;
              const fullWidth = featureCardIsOrphanFullWidth(i, content.features.length);
              return (
              <Reveal key={f.id} delay={i * 40} className={featureGridItemClass(i, content.features.length)}>
                <motion.article
                  className={`landing-bento flex h-full flex-col rounded-2xl border bg-gradient-to-br p-5 md:p-6 ${ACCENT[f.accent]} ${
                    fullWidth ? "lg:flex-row lg:items-start lg:gap-6 lg:p-8" : ""
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${FEATURE_ICON_BG[f.accent]} ${fullWidth ? "mb-0" : "mb-4"}`}>
                    <Icon size={22} variant="Bold" />
                  </span>
                  <div className={fullWidth ? "min-w-0 flex-1" : "contents"}>
                  <h3 className="text-base font-bold md:text-lg">{f.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed lp-muted">{f.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.tags.map((tag) => (
                      <span key={tag} className="rounded-full lp-card px-2.5 py-0.5 text-xs lp-muted">{tag}</span>
                    ))}
                  </div>
                  </div>
                </motion.article>
              </Reveal>
            );
            })}
          </div>
        </div>
      </section>

      <ProductFamilyBanner variant="section" />

      <section id="pricing" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal>
            <LandingPricingSection
              pricing={content.pricing}
              primaryCta={primaryCta}
              onContactPress={() => scrollToId("contact")}
            />
          </Reveal>
          <p className="mt-8 text-center">
            <Link href={PATHS.PRICING} className="text-sm text-accent hover:underline">
              مشاهده صفحه کامل قیمت‌ها
            </Link>
          </p>
        </div>
      </section>

      <section id="why-us" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal className="text-center"><h2 className="text-2xl font-bold md:text-4xl">{landingWhyTitle(t)}</h2></Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.whyUs.map((item, i) => (
              <Reveal key={item.title} delay={i * 50}>
                <div className="lp-card landing-bento h-full rounded-xl p-5">
                  <ShieldTick size={26} variant="Bold" className="text-[var(--brand-rose)]" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm lp-muted">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-y lp-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal className="text-center"><h2 className="text-2xl font-bold md:text-4xl">{t("auto.k15ad32274d")}</h2></Reveal>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {content.howSteps.map((step, i) => (
              <Reveal key={step.step} delay={i * 80} className="text-center md:text-start">
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-rose)] to-[var(--brand-violet)] text-lg font-bold text-white">{toPersianDigits(step.step)}</span>
                <h3 className="mt-3 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm lp-muted">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 px-4 sm:grid-cols-4 md:px-6">
          {[{ icon: Calendar, label: "شمسی" }, { icon: Messages2, label: "تلگرام" }, { icon: Microphone2, label: "صوتی" }, { icon: Chart, label: "تحلیل" }, { icon: Building, label: "تیمی" }, { icon: Clock, label: "زمان" }, { icon: DocumentDownload, label: "اکسل" }, { icon: Wallet2, label: "صندوق" }].map(({ icon: Icon, label }) => (
            <div key={label} className="lp-card flex flex-col items-center gap-2 rounded-xl p-4 text-center text-sm">
              <Icon size={22} className="text-[var(--brand-rose)]" /><span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <Reveal>
            <h2 className="text-2xl font-bold md:text-4xl">{content.about.title}</h2>
            {content.about.paragraphs.map((p) => (
              <p key={p} className="mt-4 lp-muted leading-relaxed">{p}</p>
            ))}
            <p className="mt-6 font-display text-sm tracking-widest lp-muted uppercase">{APP_NAME_EN}</p>
          </Reveal>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t lp-border py-16 md:py-24">
        <div className="mx-auto max-w-2xl px-4 md:px-6">
          <Reveal className="text-center"><h2 className="text-2xl font-bold md:text-3xl">{t("auto.k8e50980cfb")}</h2></Reveal>
          <Reveal className="mt-8" delay={80}><FaqList items={content.faq} /></Reveal>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <Reveal>
            <div className="landing-contact-card overflow-hidden rounded-3xl">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="landing-contact-aside p-8 md:p-10">
                <h2 className="text-2xl font-bold md:text-3xl">{content.contact.title}</h2>
                <p className="mt-3 text-sm leading-relaxed lp-muted md:text-base">{content.contact.description}</p>
                <div className="mt-8 space-y-3">
                  {[
                    { label: contactLabels.email, value: content.contact.email, href: `mailto:${content.contact.email}`, icon: Sms },
                    { label: contactLabels.telegram, value: `@${content.contact.telegram}`, href: `https://t.me/${content.contact.telegram}`, icon: Messages2 },
                    { label: contactLabels.phone, value: toPersianDigits(content.contact.phone), href: `tel:${content.contact.phone}`, icon: Call },
                  ].map((c) => (
                    <a
                      key={c.label}
                      href={c.href}
                      target={c.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="landing-contact-channel"
                    >
                      <span className="landing-contact-channel-icon">
                        <c.icon size={20} variant="Bold" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium lp-muted">{c.label}</span>
                        <span className="mt-0.5 block truncate text-sm font-semibold">{c.value}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
              <div className="landing-contact-form-panel border-t lp-border p-8 md:p-10 lg:border-s lg:border-t-0">
                <h3 className="text-lg font-semibold">{t("auto.kce3479088e")}</h3>
                <p className="mt-1 text-sm lp-muted">{t("auto.kd27699e5d5")}</p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t lp-border py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="text-center md:text-start">
              <p className="font-bold">{content.hero.title}</p>
              <p className="text-sm lp-muted">{tagline}</p>
            </div>
            <nav className="landing-footer-nav">
              {content.nav.map((item) => (
                <button key={item.id} type="button" onClick={() => scrollToId(item.id)}>{item.label}</button>
              ))}
              <Link href={PATHS.GET_STARTED}>{t("auto.k32a81e5587")}</Link>
              {!appSoon ? <Link href={PATHS.DOWNLOAD}>{t("nav.downloadApp")}</Link> : null}
            </nav>
          </div>
          <SiteFooterCredits className="mt-6" />
          <p className="mt-4 text-center text-xs lp-muted">© {formatLocalizedDigits(String(new Date().getFullYear()), language)} {content.hero.title}</p>
          <ProductFamilyBanner variant="footer" />
        </div>
      </footer>
    </div>
  );
}
