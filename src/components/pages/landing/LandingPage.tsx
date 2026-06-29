"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { Button, Input, Label, TextArea } from "@heroui/react";
import {
  ArrowLeft2,
  Building,
  Calendar,
  Chart,
  Clock,
  DocumentDownload,
  Location,
  Menu,
  Messages2,
  Microphone2,
  ShieldTick,
  TickCircle,
  Wallet2,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { APP_NAME_EN, APP_TAGLINE_FA } from "@/common/constants/brand";
import type { ILandingContent, LandingAccent, LandingSpan } from "@/common/interfaces/landing.interface";
import { submitSiteContact } from "@/common/api/site";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAppSelector } from "@/stores/hooks";
import { isAuthSelector } from "@/stores/auth";
import { LandingParticles } from "./LandingParticles";
import { LandingPricingSection } from "./LandingPricingSection";
import { useLandingContent } from "./useLandingContent";
import { useMouseParallax, useScrollProgress, useScrollReveal } from "./landing-effects";

const ACCENT: Record<LandingAccent, string> = {
  rose: "from-rose-500/15 to-rose-500/5 border-rose-500/25",
  teal: "from-teal-500/15 to-teal-500/5 border-teal-500/25",
  violet: "from-violet-500/15 to-violet-500/5 border-violet-500/25",
};

const SPAN: Record<LandingSpan, string> = {
  lg: "md:col-span-2 md:row-span-2",
  md: "md:col-span-2",
  sm: "",
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, visible] = useScrollReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={`landing-reveal ${visible ? "is-visible" : ""} ${className}`} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

function Product3D() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setTilt({ rx: ((e.clientY - r.top) / r.height - 0.5) * -10, ry: ((e.clientX - r.left) / r.width - 0.5) * 10 });
  }, []);

  return (
    <div ref={stageRef} className="landing-3d-stage relative hidden lg:block" onMouseMove={onMove} onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}>
      <div className="landing-3d-card lp-card relative rounded-[1.75rem] p-5 backdrop-blur-xl" style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}>
        <div className="mb-3 flex justify-between text-xs lp-muted">
          <span>داشبورد</span>
          <span>pdesk.ir/app</span>
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
      </div>
      <div className="landing-float-badge absolute -left-4 top-12 z-10 lp-card rounded-xl p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Location size={20} className="text-[var(--brand-teal)]" />
          GPS فعال
        </div>
      </div>
    </div>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || message.trim().length < 10) {
      showToast("نام و پیام (حداقل ۱۰ کاراکتر) الزامی است");
      return;
    }
    setSending(true);
    try {
      const res = await submitSiteContact({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim(),
      });
      showToast(res.message, "success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ارسال ناموفق");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 grid gap-4 border-t lp-border pt-8 md:grid-cols-2">
      <div>
        <Label className="text-sm">نام</Label>
        <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <Label className="text-sm">ایمیل (اختیاری)</Label>
        <Input type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label className="text-sm">موبایل (اختیاری)</Label>
        <Input type="tel" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Label className="text-sm">پیام</Label>
        <TextArea className="mt-1 w-full" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" size="lg" isDisabled={sending}>
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
  const { content } = useLandingContent(initialContent);
  const isAuth = useAppSelector(isAuthSelector);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollProgress = useScrollProgress();
  const parallax = useMouseParallax(12);
  const heroRef = useRef<HTMLElement>(null);

  const primaryCta = isAuth ? PATHS.HOME : PATHS.GET_STARTED;
  const primaryLabel = isAuth ? "ورود به داشبورد" : content.hero.primaryCta;
  const appSoon = content.settings.downloadComingSoon;

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
          <Link href={PATHS.LANDING} className="flex items-center gap-2 font-bold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-rose)] to-[var(--brand-violet)] text-sm text-white">پ</span>
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
            <ThemeToggle />
            {content.settings.showAppDownloadInNav ? (
              appSoon ? (
                <Button variant="ghost" size="sm" isDisabled className="hidden sm:flex opacity-70">
                  {content.settings.downloadLabel}
                </Button>
              ) : (
                <Link href={PATHS.DOWNLOAD} className="hidden sm:block">
                  <Button variant="ghost" size="sm"><DocumentDownload size={18} />دانلود</Button>
                </Link>
              )
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
          </nav>
        ) : null}
      </header>

      <section ref={heroRef} className="landing-spotlight landing-noise relative min-h-[92svh] overflow-hidden pt-24 pb-14 md:pt-28">
        <LandingParticles />
        <div className="landing-aurora landing-aurora-1" style={{ transform: `translate(${parallax.x * 10}px, ${parallax.y * 6}px)` }} />
        <div className="landing-aurora landing-aurora-2" style={{ transform: `translate(${parallax.x * -8}px, ${parallax.y * -5}px)` }} />
        <div className="landing-grid-3d pointer-events-none absolute inset-0" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 md:px-6 lg:grid-cols-2">
          <div>
            <p className="landing-hero-enter landing-hero-enter-d1 mb-5 inline-flex items-center gap-2 rounded-full lp-card px-3 py-1.5 text-xs font-medium backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-500" />
              {content.hero.badge}
            </p>
            <motion.h1
              className="landing-hero-enter landing-hero-enter-d2 font-sans text-3xl font-bold leading-tight md:text-5xl lg:text-6xl"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            >
              {content.hero.title}
              <span className="landing-text-shimmer mt-2 block text-2xl md:text-4xl">{content.hero.tagline}</span>
            </motion.h1>
            <p className="landing-hero-enter landing-hero-enter-d3 mt-5 max-w-lg text-base leading-relaxed lp-muted md:text-lg">{content.hero.description}</p>
            <div className="landing-hero-enter landing-hero-enter-d4 mt-8 flex flex-wrap gap-3">
              <Link href={primaryCta}><Button size="lg">{primaryLabel}<ArrowLeft2 size={18} /></Button></Link>
              <Button size="lg" variant="secondary" onPress={() => scrollToId("features")}>{content.hero.secondaryCta}</Button>
            </div>
            <div className="landing-hero-enter landing-hero-enter-d5 mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {content.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="landing-stat-glow text-2xl font-bold md:text-3xl">{toPersianDigits(stat.value)}</p>
                  <p className="mt-1 font-sans text-xs font-medium lp-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="landing-hero-enter landing-hero-enter-d3"><Product3D /></div>
        </div>
      </section>

      <div className="border-y lp-border overflow-hidden py-4">
        <div className="landing-marquee-track gap-10 px-6">
          {[...content.marquee, ...content.marquee].map((label, i) => (
            <span key={`${label}-${i}`} className="shrink-0 text-sm font-medium lp-muted">{label}</span>
          ))}
        </div>
      </div>

      <section id="features" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold md:text-4xl">امکانات <span className="landing-text-shimmer">یکپارچه</span></h2>
            <p className="mt-3 text-sm lp-muted md:text-base">هر ماژول عمیق و حرفه‌ای — برای کار واقعی.</p>
          </Reveal>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {content.features.map((f, i) => (
              <Reveal key={f.id} delay={i * 60} className={SPAN[f.span]}>
                <motion.article
                  className={`landing-bento h-full rounded-2xl border bg-gradient-to-br p-5 md:p-6 ${ACCENT[f.accent]} ${SPAN[f.span]}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed lp-muted">{f.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {f.tags.map((tag) => (
                      <span key={tag} className="rounded-full lp-card px-2.5 py-0.5 text-xs lp-muted">{tag}</span>
                    ))}
                  </div>
                </motion.article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="business" className="scroll-mt-20 border-y lp-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div className="relative mx-auto flex size-48 items-center justify-center md:size-56">
                <div className="landing-gps-ring absolute inset-0" />
                <div className="landing-gps-ring absolute inset-0" />
                <Location size={40} variant="Bold" className="relative z-10 text-[var(--brand-teal)]" />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <p className="text-sm font-semibold text-[var(--brand-violet)]">{content.business.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-bold md:text-4xl">{content.business.title}<span className="block text-[var(--brand-rose-deep)]">{content.business.highlight}</span></h2>
              <p className="mt-4 lp-muted leading-relaxed">{content.business.description}</p>
              <ul className="mt-5 space-y-2">
                {content.business.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm"><TickCircle size={18} variant="Bold" className="text-[var(--brand-teal-deep)]" />{b}</li>
                ))}
              </ul>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.business.features.map((item, i) => (
              <Reveal key={item.title} delay={i * 50}>
                <div className="landing-bento lp-card h-full rounded-xl p-4">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm lp-muted">{item.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

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
          <Reveal className="text-center"><h2 className="text-2xl font-bold md:text-4xl">چرا {content.hero.title}؟</h2></Reveal>
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
          <Reveal className="text-center"><h2 className="text-2xl font-bold md:text-4xl">۴ قدم تا شروع</h2></Reveal>
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
          <Reveal className="text-center"><h2 className="text-2xl font-bold md:text-3xl">سوالات متداول</h2></Reveal>
          <Reveal className="mt-8" delay={80}><FaqList items={content.faq} /></Reveal>
        </div>
      </section>

      {/* Contact — prominent */}
      <section id="contact" className="scroll-mt-20 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="landing-contact-card rounded-3xl p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">{content.contact.title}</h2>
                <p className="mt-3 text-base lp-muted">{content.contact.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "ایمیل", value: content.contact.email, href: `mailto:${content.contact.email}` },
                  { label: "تلگرام", value: `@${content.contact.telegram}`, href: `https://t.me/${content.contact.telegram}` },
                  { label: "تلفن", value: toPersianDigits(content.contact.phone), href: `tel:${content.contact.phone}` },
                ].map((c) => (
                  <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="lp-card rounded-2xl p-4 text-center transition hover:border-[var(--brand-rose)]">
                    <p className="text-xs font-medium lp-muted">{c.label}</p>
                    <p className="mt-2 text-sm font-bold break-all">{c.value}</p>
                  </a>
                ))}
              </div>
            </div>
            <ContactForm />
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={primaryCta}><Button size="lg">{primaryLabel}</Button></Link>
              {appSoon ? (
                <Button size="lg" variant="secondary" isDisabled>{content.settings.downloadLabel} — اپ موبایل</Button>
              ) : (
                <Link href={PATHS.DOWNLOAD}><Button size="lg" variant="secondary">دانلود اپ</Button></Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t lp-border py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="text-center md:text-start">
              <p className="font-bold">{content.hero.title}</p>
              <p className="text-sm lp-muted">{APP_TAGLINE_FA}</p>
            </div>
            <nav className="landing-footer-nav">
              {content.nav.map((item) => (
                <button key={item.id} type="button" onClick={() => scrollToId(item.id)}>{item.label}</button>
              ))}
              <Link href={PATHS.GET_STARTED}>ورود</Link>
              {!appSoon ? <Link href={PATHS.DOWNLOAD}>دانلود</Link> : <span className="opacity-60">{content.settings.downloadLabel}</span>}
            </nav>
          </div>
          <p className="mt-8 text-center text-xs lp-muted">© {toPersianDigits(String(new Date().getFullYear()))} {content.hero.title}</p>
        </div>
      </footer>
    </div>
  );
}
