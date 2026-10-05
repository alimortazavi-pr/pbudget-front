"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  Briefcase,
  Cloud,
  CloseCircle,
  DocumentUpload,
  Export,
  Home2,
  Lock1,
  EyeSlash,
  Shop,
  ShieldTick,
  Teacher,
  TickCircle,
} from "iconsax-reactjs";

import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { formatLocalizedDigits } from "@/i18n/format-localized-digits";

function Heading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="lx-reveal mx-auto max-w-2xl text-center">
      <span className="lx-eyebrow">{eyebrow}</span>
      <h2 className="lx-h2 mt-4">{title}</h2>
      {subtitle ? <p className="lx-muted mt-4 text-base leading-8 md:text-lg">{subtitle}</p> : null}
    </div>
  );
}

function glow(event: React.PointerEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty("--mx2", `${event.clientX - rect.left}px`);
  event.currentTarget.style.setProperty("--my2", `${event.clientY - rect.top}px`);
}

/* ------------------------------------------------------------------ bento */

export function BentoShowcase() {
  const { t, language } = useTranslation();
  const digits = (value: string) => formatLocalizedDigits(value, language);
  const circumference = 2 * Math.PI * 40;
  const categories = [
    { label: t("landingUi.mockTx2"), value: 85, color: "#f59e0b" },
    { label: t("landingUi.mockTx3"), value: 40, color: "#2dd4bf" },
    { label: t("landingUi.mockTx1"), value: 62, color: "#a78bfa" },
  ];
  const marked = [3, 8, 13, 20, 27];
  const boxes = [38, 76, 100];

  return (
    <section id="showcase" className="relative scroll-mt-20 py-20 md:py-28">
      <div className="lx-container">
        <Heading eyebrow={t("landingUi.showcaseEyebrow")} title={t("landingUi.showcaseTitle")} subtitle={t("landingUi.showcaseSubtitle")} />

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {/* budget */}
          <article data-rise className="l3-card md:col-span-3" onPointerMove={glow}>
            <h3 className="font-bold">{t("landingUi.bentoBudgetTitle")}</h3>
            <p className="lx-muted mt-1 text-sm leading-7">{t("landingUi.bentoBudgetBody")}</p>
            <div className="mt-5 flex items-center gap-5" aria-hidden>
              <div className="relative size-28 shrink-0">
                <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-secondary)" strokeWidth="11" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--lx-rose)" strokeWidth="11" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * 0.28} className="l3-ring-draw" />
                </svg>
                <span className="absolute inset-0 grid place-items-center text-xl font-extrabold">{digits("72%")}</span>
              </div>
              <ul className="min-w-0 flex-1 space-y-3">
                {categories.map((row) => (
                  <li key={row.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate">{row.label}</span>
                      <b>{digits(`${row.value}%`)}</b>
                    </div>
                    <div className="pb-meter"><span style={{ width: `${row.value}%`, background: row.color }} /></div>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* calendar */}
          <article data-rise className="l3-card md:col-span-3" onPointerMove={glow}>
            <h3 className="font-bold">{t("landingUi.bentoCalTitle")}</h3>
            <p className="lx-muted mt-1 text-sm leading-7">{t("landingUi.bentoCalBody")}</p>
            <div className="l3-minical mt-5" aria-hidden>
              <span className="l3-minical-head">{digits("1405/07")}</span>
              {Array.from({ length: 33 }, (_, index) => {
                const day = index - 2;
                if (day < 1 || day > 30) return <i key={index} />;
                return (
                  <i key={index} data-mark={marked.includes(day)} data-today={day === 13}>
                    {digits(String(day))}
                  </i>
                );
              })}
            </div>
          </article>

          {/* installments */}
          <article data-rise className="l3-card md:col-span-2" onPointerMove={glow}>
            <h3 className="font-bold">{t("landingUi.bentoPlanTitle")}</h3>
            <p className="lx-muted mt-1 text-sm leading-7">{t("landingUi.bentoPlanBody")}</p>
            <ul className="mt-5 space-y-3" aria-hidden>
              {[[5, 12], [8, 10], [2, 6]].map(([done, all]) => (
                <li key={`${done}-${all}`}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{t("landingUi.mockTx3")}</span>
                    <b>{digits(`${done} / ${all}`)}</b>
                  </div>
                  <div className="pb-meter"><span style={{ width: `${(done / all) * 100}%`, background: "var(--lx-violet)" }} /></div>
                </li>
              ))}
            </ul>
          </article>

          {/* boxes */}
          <article data-rise className="l3-card md:col-span-2" onPointerMove={glow}>
            <h3 className="font-bold">{t("landingUi.bentoBoxTitle")}</h3>
            <p className="lx-muted mt-1 text-sm leading-7">{t("landingUi.bentoBoxBody")}</p>
            <div className="mt-5 flex justify-between gap-2" aria-hidden>
              {boxes.map((value) => (
                <span key={value} className="l3-orbfill" style={{ ["--v" as string]: value } as CSSProperties}>
                  {value === 100 ? <TickCircle size={20} variant="Bold" /> : digits(`${value}%`)}
                </span>
              ))}
            </div>
          </article>

          {/* bank import */}
          <article data-rise className="l3-card md:col-span-2" onPointerMove={glow}>
            <h3 className="font-bold">{t("landingUi.bentoImportTitle")}</h3>
            <p className="lx-muted mt-1 text-sm leading-7">{t("landingUi.bentoImportBody")}</p>
            <div className="mt-5" aria-hidden>
              <span className="inline-flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-1.5 text-xs font-semibold">
                <DocumentUpload size={16} variant="Bold" className="text-[var(--lx-teal)]" />
                statement.xlsx
              </span>
              <ul className="mt-3 space-y-1.5">
                {["+45,000,000", "−1,240,000", "−4,200,000"].map((amount, index) => (
                  <li key={amount} className="l3-slidein flex justify-between rounded-lg bg-surface-secondary/70 px-3 py-1.5 text-xs" style={{ animationDelay: `${index * 0.9}s` }}>
                    <span>{[t("landingUi.mockTx1"), t("landingUi.mockTx2"), t("landingUi.mockTx3")][index]}</span>
                    <b dir="ltr" className={amount.startsWith("+") ? "text-income" : "text-expense"}>{digits(amount)}</b>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          {/* partners */}
          <article data-rise className="l3-card md:col-span-6" onPointerMove={glow}>
            <div className="grid items-center gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-bold">{t("landingUi.bentoShareTitle")}</h3>
                <p className="lx-muted mt-1 text-sm leading-7">{t("landingUi.bentoShareBody")}</p>
              </div>
              <div aria-hidden>
                <div className="flex items-center gap-3">
                  <div className="l3-avatars !flex">
                    {["#fb7185", "#a78bfa", "#2dd4bf"].map((color, index) => (
                      <span key={color} style={{ background: color, borderColor: "var(--surface)" }}>{["A", "B", "C"][index]}</span>
                    ))}
                  </div>
                  <span className="text-xs text-muted">{digits("50% · 30% · 20%")}</span>
                </div>
                <div className="mt-3 flex h-3 overflow-hidden rounded-full">
                  <span className="l3-split" style={{ width: "50%", background: "#fb7185" }} />
                  <span className="l3-split" style={{ width: "30%", background: "#a78bfa", animationDelay: "0.15s" }} />
                  <span className="l3-split" style={{ width: "20%", background: "#2dd4bf", animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- personas */

export function PersonaSection() {
  const { t } = useTranslation();
  const personas = [
    { id: "p1", icon: Briefcase, accent: "violet" },
    { id: "p2", icon: Home2, accent: "rose" },
    { id: "p3", icon: Shop, accent: "teal" },
    { id: "p4", icon: Teacher, accent: "violet" },
  ] as const;
  return (
    <section id="for-whom" className="scroll-mt-20 py-20 md:py-28">
      <div className="lx-container">
        <Heading eyebrow={t("landingUi.forEyebrow")} title={t("landingUi.forTitle")} subtitle={t("landingUi.forSubtitle")} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map(({ id, icon: Icon, accent }) => (
            <article key={id} data-rise className="l3-card l3-persona" onPointerMove={glow}>
              <span className="lx-icon" data-accent={accent}>
                <Icon size={22} variant="Bold" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{t(`landingUi.${id}Title`)}</h3>
              <p className="lx-muted mt-2 text-sm leading-7">{t(`landingUi.${id}Body`)}</p>
              <ul className="mt-4 space-y-2 border-t border-border/60 pt-4">
                {["a", "b", "c"].map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm">
                    <TickCircle size={16} variant="Bold" className="mt-1 shrink-0 text-[var(--lx-teal)]" />
                    {t(`landingUi.${id}${key}`)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- simulator */

export function SavingsSimulator({ href }: { href: string }) {
  const { t, language } = useTranslation();
  const digits = (value: string) => formatLocalizedDigits(value, language);
  const [monthly, setMonthly] = useState(10);
  const [goal, setGoal] = useState(300);

  const months = Math.ceil(goal / monthly);
  const boosted = Math.ceil(goal / (monthly * 1.1));
  const saved = months - boosted;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const time =
    years > 0
      ? `${digits(String(years))} ${t("landingUi.simYears")}${rest ? ` ${digits(String(rest))} ${t("landingUi.simMonths")}` : ""}`
      : `${digits(String(months))} ${t("landingUi.simMonths")}`;
  const progress = Math.min(100, (monthly / goal) * 100 * 12);

  return (
    <section id="simulator" className="l3-stage scroll-mt-20 py-20 md:py-28">
      <div className="l3-aurora"><span className="l3-orb l3-orb-b" /><span className="l3-orb l3-orb-c" /></div>
      <div className="lx-container">
        <Heading eyebrow={t("landingUi.simEyebrow")} title={t("landingUi.simTitle")} subtitle={t("landingUi.simSubtitle")} />
        <div data-rise className="l3-g mx-auto mt-12 grid max-w-4xl gap-8 p-6 md:grid-cols-2 md:p-9">
          <div className="space-y-7">
            <label className="block">
              <span className="flex items-baseline justify-between text-sm font-semibold">
                {t("landingUi.simMonthly")}
                <b className="text-lg">{digits(String(monthly))} <small className="text-xs font-normal opacity-70">{t("landingUi.simUnit")}</small></b>
              </span>
              <input type="range" min={1} max={100} step={1} value={monthly} onChange={(event) => setMonthly(Number(event.target.value))} className="l3-range mt-3" aria-label={t("landingUi.simMonthly")} />
            </label>
            <label className="block">
              <span className="flex items-baseline justify-between text-sm font-semibold">
                {t("landingUi.simGoal")}
                <b className="text-lg">{digits(String(goal))} <small className="text-xs font-normal opacity-70">{t("landingUi.simUnit")}</small></b>
              </span>
              <input type="range" min={10} max={2000} step={10} value={goal} onChange={(event) => setGoal(Number(event.target.value))} className="l3-range mt-3" aria-label={t("landingUi.simGoal")} />
            </label>
          </div>

          <div className="flex flex-col justify-between gap-5">
            <div>
              <p className="text-5xl font-black leading-none lx-gradient-text md:text-6xl">
                <AnimatedNumber value={months} format={(n) => digits(String(Math.round(n)))} durationMs={500} />
              </p>
              <p className="mt-2 text-sm opacity-70">{t("landingUi.simMonths")}</p>
              <p className="mt-4 text-sm leading-7">{t("landingUi.simResult", { time })}</p>
              <p className="mt-2 text-xs leading-6 opacity-70">
                {saved >= 1 ? t("landingUi.simBoost", { saved: digits(String(saved)) }) : t("landingUi.simNever")}
              </p>
            </div>
            <div>
              <div className="l3-pbar"><i style={{ width: `${progress}%`, transition: "width .5s var(--pb-ease-out)" }} /></div>
              <Link href={href} className="lx-btn lx-btn-primary mt-4 w-full">
                {t("landingUi.simCta")}
                <ArrowLeft size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- compare */

export function CompareSection() {
  const { t } = useTranslation();
  const rows = ["cmpR1", "cmpR2", "cmpR3", "cmpR4", "cmpR5", "cmpR6"];
  return (
    <section id="compare" className="scroll-mt-20 py-20 md:py-28">
      <div className="lx-container">
        <Heading eyebrow={t("landingUi.cmpEyebrow")} title={t("landingUi.cmpTitle")} />
        <div data-rise className="l3-compare mx-auto mt-12 max-w-3xl">
          <div className="l3-compare-head">
            <span />
            <span>{t("landingUi.cmpOld")}</span>
            <span className="l3-compare-new">{t("landingUi.cmpNew")}</span>
          </div>
          {rows.map((row) => (
            <div key={row} className="l3-compare-row">
              <span>{t(`landingUi.${row}`)}</span>
              <span className="grid place-items-center"><CloseCircle size={22} variant="Bold" className="text-rose-400/80" aria-label="no" /></span>
              <span className="l3-compare-new grid place-items-center"><TickCircle size={22} variant="Bold" className="text-[var(--lx-teal)]" aria-label="yes" /></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- security */

export function SecuritySection() {
  const { t } = useTranslation();
  const items = [
    { id: "sec1", icon: Lock1 },
    { id: "sec2", icon: Cloud },
    { id: "sec3", icon: Export },
    { id: "sec4", icon: EyeSlash },
  ];
  return (
    <section id="security" className="relative scroll-mt-20 overflow-hidden border-y border-border/60 bg-surface/50 py-20 md:py-28">
      <div className="lx-container">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <span className="l3-shield" aria-hidden>
            <ShieldTick size={34} variant="Bold" />
          </span>
          <span className="lx-eyebrow mt-6">{t("landingUi.secEyebrow")}</span>
          <h2 className="lx-h2 mt-4">{t("landingUi.secTitle")}</h2>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ id, icon: Icon }) => (
            <article key={id} data-rise className="l3-card" onPointerMove={glow}>
              <span className="lx-icon" data-accent="teal">
                <Icon size={22} variant="Bold" />
              </span>
              <h3 className="mt-5 font-bold">{t(`landingUi.${id}T`)}</h3>
              <p className="lx-muted mt-2 text-sm leading-7">{t(`landingUi.${id}B`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

