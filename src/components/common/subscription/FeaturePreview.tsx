"use client";

import type { ReactNode } from "react";

/**
 * Static, clearly fake mock-ups of the pages a plan unlocks, so people can see
 * what they would get. Nothing here reads or shows real user data.
 */

const money = (value: number) => value.toLocaleString("fa-IR");

function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-surface p-4 ${className}`}>
      {title ? <p className="mb-3 text-sm font-bold">{title}</p> : null}
      {children}
    </div>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-3">
      <p className="text-[11px] text-muted">{label}</p>
      <p className={`mt-1 text-base font-extrabold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function Bar({ label, value, max, color = "bg-accent" }: { label: string; value: number; max: number; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums text-muted">{money(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function Row({ left, sub, right, chip }: { left: string; sub?: string; right?: string; chip?: { text: string; tone: string } }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{left}</p>
        {sub ? <p className="text-[11px] text-muted">{sub}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {chip ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip.tone}`}>{chip.text}</span> : null}
        {right ? <span className="text-sm font-semibold tabular-nums">{right}</span> : null}
      </div>
    </div>
  );
}

const OK = "bg-success/15 text-success-foreground";
const WARN = "bg-warning/20 text-warning-foreground";
const NEUTRAL = "bg-surface-secondary text-muted";

function LineChart() {
  const income = [52, 58, 55, 64, 61, 70];
  const cost = [44, 49, 47, 51, 50, 53];
  const points = (data: number[]) => data.map((value, index) => `${index * 40 + 10},${90 - value}`).join(" ");
  return (
    <svg viewBox="0 0 220 100" className="h-36 w-full" role="img" aria-hidden>
      <polyline points={points(income)} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success" />
      <polyline points={points(cost)} fill="none" stroke="currentColor" strokeWidth="2.5" className="text-danger" />
    </svg>
  );
}

const PREVIEWS: Record<string, () => ReactNode> = {
  analytics: () => (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="درآمد" value={money(70000000)} tone="text-success" />
        <Stat label="هزینه" value={money(53000000)} tone="text-danger" />
        <Stat label="خالص" value={money(17000000)} />
      </div>
      <Card title="روند ۶ ماه اخیر">
        <LineChart />
      </Card>
      <Card title="هزینه‌ها بر اساس دسته">
        <div className="space-y-3">
          <Bar label="اجاره و قبوض" value={15000000} max={20000000} />
          <Bar label="خوراک" value={9000000} max={20000000} color="bg-warning" />
          <Bar label="حمل‌ونقل" value={4500000} max={20000000} color="bg-success" />
        </div>
      </Card>
    </div>
  ),
  planner: () => (
    <div className="space-y-3">
      <Card title="برنامهٔ امروز">
        <Row left="جلسهٔ هماهنگی تیم" sub="۰۹:۳۰" chip={{ text: "انجام شد", tone: OK }} />
        <Row left="ارسال پیش‌فاکتور مشتری" sub="۱۱:۰۰" chip={{ text: "در انتظار", tone: WARN }} />
        <Row left="پرداخت قبض برق" sub="۱۶:۰۰" chip={{ text: "در انتظار", tone: WARN }} />
      </Card>
      <Card title="روتین‌های هفتگی">
        <Row left="مرور بودجهٔ هفته" sub="شنبه‌ها" />
        <Row left="پیگیری چک‌های دریافتی" sub="سه‌شنبه‌ها" />
      </Card>
    </div>
  ),
  projects: () => (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        ["بازسازی دفتر", 62, "۱۲٬۰۰۰٬۰۰۰ از ۲۰٬۰۰۰٬۰۰۰"],
        ["کمپین تبلیغاتی", 35, "۳٬۵۰۰٬۰۰۰ از ۱۰٬۰۰۰٬۰۰۰"],
      ].map(([name, progress, budget]) => (
        <Card key={String(name)} title={String(name)}>
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{budget} تومان</p>
        </Card>
      ))}
      <Card title="آخرین هزینه‌های پروژه" className="sm:col-span-2">
        <Row left="خرید رنگ و مصالح" sub="بازسازی دفتر" right={money(2400000)} />
        <Row left="چاپ بنر" sub="کمپین تبلیغاتی" right={money(850000)} />
      </Card>
    </div>
  ),
  partners: () => (
    <div className="space-y-3">
      <Card title="شرکا">
        <Row left="علی رضایی" sub="سهم ۵۰٪" right={money(8500000)} chip={{ text: "طلبکار", tone: OK }} />
        <Row left="مریم احمدی" sub="سهم ۵۰٪" right={money(3200000)} chip={{ text: "بدهکار", tone: WARN }} />
      </Card>
      <Card title="پیشنهاد تسویه">
        <Row left="مریم ← علی" sub="تسویهٔ حساب این ماه" right={money(2650000)} />
      </Card>
    </div>
  ),
  bank_import: () => (
    <div className="space-y-3">
      <div className="flex h-24 items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm text-muted">فایل صورتحساب بانکی (Excel / CSV)</div>
      <Card title="تراکنش‌های شناسایی‌شده">
        <Row left="خرید از فروشگاه آنلاین" sub="۱۴۰۵/۰۷/۱۲" right={money(1250000)} chip={{ text: "خرید", tone: NEUTRAL }} />
        <Row left="واریز حقوق" sub="۱۴۰۵/۰۷/۰۱" right={money(30000000)} chip={{ text: "درآمد", tone: OK }} />
        <Row left="قبض اینترنت" sub="۱۴۰۵/۰۷/۰۵" right={money(420000)} chip={{ text: "قبوض", tone: NEUTRAL }} />
      </Card>
    </div>
  ),
  work_time: () => (
    <Card title="تردد این هفته">
      <Row left="شنبه" sub="۰۸:۱۵ تا ۱۶:۴۵" right="۸ ساعت" />
      <Row left="یکشنبه" sub="۰۸:۳۰ تا ۱۷:۰۰" right="۸ ساعت" />
      <Row left="دوشنبه" sub="مرخصی" chip={{ text: "تأییدشده", tone: OK }} />
    </Card>
  ),
  custom_exports: () => (
    <div className="space-y-3">
      <Card title="قالب خروجی شرکت">
        <div className="flex flex-wrap gap-2 text-xs">
          {["تاریخ", "شرح", "دسته", "مبلغ", "شمارهٔ سند"].map((column) => (
            <span key={column} className="rounded-full bg-accent/12 px-3 py-1 font-semibold text-accent">
              {column}
            </span>
          ))}
        </div>
      </Card>
      <div className="flex h-11 items-center justify-center rounded-xl bg-accent/90 text-sm font-semibold text-accent-foreground">دریافت خروجی Excel</div>
    </div>
  ),
  ai: () => (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="درآمد" value={money(70000000)} />
        <Stat label="هزینه" value={money(53000000)} />
        <Stat label="نرخ پس‌انداز" value="۲۴٪" tone="text-success" />
      </div>
      <Card>
        <p className="rounded-xl bg-accent/12 px-3 py-2 text-sm">برای ماه بعد چه بودجه‌ای پیشنهاد می‌دهی؟</p>
        <p className="mt-2 rounded-xl bg-surface-secondary px-3 py-2 text-sm leading-7">با توجه به اقساط سررسیدشونده، سقف خوراک ۹٬۰۰۰٬۰۰۰ و پس‌انداز ۵٬۰۰۰٬۰۰۰ تومان مناسب است.</p>
      </Card>
    </div>
  ),
  boxes: () => (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="صندوق سفر">
        <Bar label="۶٬۵۰۰٬۰۰۰ از ۱۰٬۰۰۰٬۰۰۰" value={6500000} max={10000000} color="bg-success" />
      </Card>
      <Card title="صندوق اضطراری">
        <Bar label="۱۲٬۰۰۰٬۰۰۰ از ۳۰٬۰۰۰٬۰۰۰" value={12000000} max={30000000} />
      </Card>
    </div>
  ),
  payment_cards: () => (
    <Card title="کارت‌های من">
      <Row left="کارت اصلی" sub="•••• ۱۲۳۴" chip={{ text: "ملی", tone: NEUTRAL }} />
      <Row left="کارت پس‌انداز" sub="•••• ۵۶۷۸" chip={{ text: "ملت", tone: NEUTRAL }} />
    </Card>
  ),
  notes: () => (
    <Card title="یادداشت‌ها">
      <Row left="ایدهٔ بودجه‌بندی سال جدید" sub="امروز" />
      <Row left="لیست خرید ماهانه" sub="دیروز" />
    </Card>
  ),
  commitments: () => (
    <Card title="تعهدات پیش‌رو">
      <Row left="قسط وام خودرو" sub="۵ روز دیگر" right={money(4200000)} chip={{ text: "قسط", tone: NEUTRAL }} />
      <Row left="چک پرداختنی" sub="۱۱ روز دیگر" right={money(6500000)} chip={{ text: "چک", tone: WARN }} />
    </Card>
  ),
  debts: () => (
    <Card title="طلب و بدهی">
      <Row left="طلب از محمد کریمی" sub="سررسید ۱۴۰۵/۰۸/۰۱" right={money(5000000)} chip={{ text: "طلب", tone: OK }} />
      <Row left="بدهی به فروشگاه" sub="سررسید ۱۴۰۵/۰۷/۲۵" right={money(1800000)} chip={{ text: "بدهی", tone: WARN }} />
    </Card>
  ),
  installments: () => (
    <Card title="اقساط">
      <Row left="وام خودرو" sub="قسط ۸ از ۲۴ · ۱۴۰۵/۰۷/۲۰" right={money(4200000)} />
      <Row left="خرید لپ‌تاپ" sub="قسط ۳ از ۱۲ · ۱۴۰۵/۰۷/۲۸" right={money(1800000)} />
    </Card>
  ),
  checks: () => (
    <Card title="چک‌ها">
      <Row left="چک شمارهٔ ۱۲۳۴۵" sub="پرداختنی · ۱۴۰۵/۰۸/۰۵" right={money(6500000)} chip={{ text: "در انتظار", tone: WARN }} />
      <Row left="چک شمارهٔ ۶۷۸۹۰" sub="دریافتی · ۱۴۰۵/۰۷/۳۰" right={money(12000000)} chip={{ text: "وصول‌شده", tone: OK }} />
    </Card>
  ),
};

export function hasFeaturePreview(feature: string) {
  return feature in PREVIEWS;
}

export function FeaturePreview({ feature }: { feature: string }) {
  const render = PREVIEWS[feature];
  if (!render) return null;
  return (
    <div className="relative" aria-hidden>
      <div className="pointer-events-none select-none opacity-90">{render()}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
