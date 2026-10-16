"use client";

import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { SubscriptionOverview, SubscriptionOverviewPoint } from "@/common/api/subscriptions";
import { formatNumberFa } from "../ui/admin-format";
import { SOURCE_LABEL, formatRateFa, formatTomanFa, formatTomanShortFa } from "./subscription-format";

type Granularity = "day" | "week" | "month";

const dayLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" });
const monthLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long", year: "2-digit" });
const monthKey = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric" });

const tooltipStyle = { borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", direction: "rtl" as const, fontSize: 12 };
const axisTick = { fontSize: 11, fill: "var(--muted)" };

/** Daily points → day / week / Jalali-month buckets for readable long ranges. */
export function bucketSeries(series: SubscriptionOverviewPoint[], granularity: Granularity) {
  const buckets: (SubscriptionOverviewPoint & { label: string })[] = [];
  series.forEach((point, index) => {
    const date = new Date(`${point.date}T12:00:00`);
    const key = granularity === "day" ? point.date : granularity === "week" ? String(Math.floor(index / 7)) : monthKey.format(date);
    const last = buckets[buckets.length - 1];
    if (last && (last as { key?: string }).key === key) {
      last.revenue += point.revenue;
      last.payments += point.payments;
      last.newPaid += point.newPaid;
      last.churned += point.churned;
      last.trials += point.trials;
      return;
    }
    buckets.push({
      ...point,
      key,
      label: granularity === "month" ? monthLabel.format(date) : granularity === "week" ? `هفتهٔ ${dayLabel.format(date)}` : dayLabel.format(date),
    } as SubscriptionOverviewPoint & { label: string; key: string });
  });
  return buckets;
}

export function granularityFor(days: number): Granularity {
  return days >= 365 ? "month" : days >= 180 ? "week" : "day";
}

export function RevenueChart({ series, days }: { series: SubscriptionOverviewPoint[]; days: number }) {
  const data = useMemo(() => bucketSeries(series, granularityFor(days)), [series, days]);
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="subRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
          <YAxis width={64} tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(value) => formatTomanShortFa(Number(value), false)} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }}
            formatter={(value, _name, item) => [`${formatTomanFa(Number(value))} · ${formatNumberFa((item?.payload as SubscriptionOverviewPoint)?.payments ?? 0)} پرداخت`, "درآمد"]}
          />
          <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#subRevenueFill)" activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--surface)" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const SERIES_LABEL: Record<string, string> = { newPaid: "اشتراک پولی جدید", churned: "ریزش", trials: "دورهٔ آزمایشی" };

export function GrowthChart({ series, days }: { series: SubscriptionOverviewPoint[]; days: number }) {
  const data = useMemo(() => bucketSeries(series, granularityFor(days)), [series, days]);
  return (
    // Categorical slots 1 (blue) and 2 (orange), stepped for each theme.
    <div className="h-72 w-full [--viz-new:#2a78d6] [--viz-churn:#eb6834] dark:[--viz-new:#3987e5] dark:[--viz-churn:#d95926]" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
          <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(value) => formatNumberFa(Number(value))} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-secondary)", opacity: 0.5 }} formatter={(value, name) => [formatNumberFa(Number(value)), SERIES_LABEL[String(name)] ?? name]} />
          <Legend verticalAlign="top" align="right" height={28} iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-muted">{SERIES_LABEL[String(value)] ?? value}</span>} />
          <Bar dataKey="newPaid" fill="var(--viz-new)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="churned" fill="var(--viz-churn)" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Plan mix as labelled horizontal bars (easier to compare than a pie). */
export function PlanMixList({ planMix }: { planMix: SubscriptionOverview["planMix"] }) {
  const total = planMix.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(1, ...planMix.map((item) => item.count));
  if (!planMix.length) return <p className="py-8 text-center text-sm text-muted">هنوز اشتراک پولی فعالی وجود ندارد.</p>;
  return (
    <ul className="space-y-3.5">
      {planMix.map((item) => (
        <li key={item.planId} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold">{item.name}</span>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {formatNumberFa(item.count)} مشترک · {formatRateFa(total ? item.count / total : 0)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          {item.mrr ? <p className="text-[11px] text-muted">درآمد ماهانهٔ تکراری: {formatTomanFa(item.mrr)}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function SourceMixBar({ sourceMix, revenueBySource }: { sourceMix: SubscriptionOverview["sourceMix"]; revenueBySource: SubscriptionOverview["revenueBySource30d"] }) {
  const total = sourceMix.reduce((sum, item) => sum + item.count, 0);
  const tones: Record<string, string> = { bale: "bg-sky-500", bazaar: "bg-emerald-500", manual: "bg-violet-500", trial: "bg-amber-500" };
  if (!total) return <p className="py-4 text-center text-sm text-muted">داده‌ای برای نمایش نیست.</p>;
  return (
    <div className="space-y-3">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="سهم کانال‌های فروش">
        {sourceMix.map((item) => (
          <div key={item.source} className={`${tones[item.source] ?? "bg-zinc-400"} first:rounded-s-full last:rounded-e-full`} style={{ width: `${(item.count / total) * 100}%` }} title={`${SOURCE_LABEL[item.source] ?? item.source}: ${formatNumberFa(item.count)}`} />
        ))}
      </div>
      <ul className="grid gap-2 text-xs sm:grid-cols-2">
        {sourceMix.map((item) => {
          const revenue = revenueBySource.find((row) => row.source === item.source)?.revenue ?? 0;
          return (
            <li key={item.source} className="flex items-center justify-between gap-2 rounded-lg bg-surface-secondary/60 px-2.5 py-1.5">
              <span className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${tones[item.source] ?? "bg-zinc-400"}`} />
                {SOURCE_LABEL[item.source] ?? item.source}
              </span>
              <span className="text-muted tabular-nums">
                {formatNumberFa(item.count)} {revenue ? `· ${formatTomanShortFa(revenue)} (۳۰ روز)` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
