"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { ArrowDown, ArrowUp, Chart, Clock, Crown, DiscountShape, Flash, MoneyRecive, Profile2User, ReceiptMinus, Refresh2, Repeat, Timer1, TrendDown } from "iconsax-reactjs";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { SubscriptionOverview } from "@/common/api/subscriptions";
import { showErrorToast } from "@/common/utils/toast";
import { AdminPanel, EmptyState, SegmentedTabs, SkeletonRows, StatTile } from "../ui/AdminUi";
import { formatDateTimeFa, formatNumberFa } from "../ui/admin-format";
import { GrowthChart, PlanMixList, RevenueChart, SourceMixBar } from "./SubscriptionCharts";
import { deltaOf, formatRateFa, formatTomanFa, formatTomanShortFa } from "./subscription-format";

const RANGES = [
  { id: "30", label: "۳۰ روز" },
  { id: "90", label: "۹۰ روز" },
  { id: "180", label: "۶ ماه" },
  { id: "365", label: "یک سال" },
] as const;

function Delta({ current, previous, invert = false, suffix = "نسبت به ۳۰ روز قبل" }: { current: number; previous: number; invert?: boolean; suffix?: string }) {
  const delta = deltaOf(current, previous);
  if (delta === null) return <span className="text-xs text-muted">بدون داده برای مقایسه</span>;
  const up = delta >= 0;
  const good = invert ? !up : up;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-xs">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${delta === 0 ? "bg-surface-secondary text-muted" : good ? "bg-success/15 text-success-foreground" : "bg-danger/12 text-danger"}`}>
        {delta === 0 ? null : up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
        {formatRateFa(Math.abs(delta))}
      </span>
      <span className="text-muted">{suffix}</span>
    </span>
  );
}

function MiniStat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface px-3.5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="truncate text-sm font-bold tabular-nums">{value}</p>
        {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export function SubscriptionOverviewTab({ onOpenRequests, onOpenExpiring, refreshKey }: { onOpenRequests: () => void; onOpenExpiring: () => void; refreshKey: number }) {
  const [days, setDays] = useState<(typeof RANGES)[number]["id"]>("90");
  const [data, setData] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await subscriptionApi.fetchAdminSubscriptionOverview(Number(days)));
      setFailed(false);
    } catch (error) {
      setFailed(true);
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (!data && failed) {
    return (
      <EmptyState
        title="بارگذاری داشبورد اشتراک‌ها ناموفق بود"
        action={
          <Button size="sm" variant="secondary" onPress={() => void load()}>
            تلاش دوباره
          </Button>
        }
      />
    );
  }
  if (!data) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-secondary" />
          ))}
        </div>
        <SkeletonRows rows={2} height="h-72" />
      </div>
    );
  }

  const { kpis } = data;
  const rangeLabel = RANGES.find((range) => range.id === days)?.label ?? "";

  return (
    <div className={`space-y-5 transition-opacity ${loading ? "opacity-70" : ""}`}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="درآمد ماهانهٔ تکراری (MRR)" value={formatTomanShortFa(kpis.mrr)} icon={<Repeat size={20} variant="Bold" />} tone="accent" hint={`از ${formatNumberFa(kpis.activePaid)} مشترک پولی فعال`} />
        <StatTile label="درآمد ۳۰ روز اخیر" value={formatTomanShortFa(kpis.revenue30d)} icon={<MoneyRecive size={20} variant="Bold" />} tone="success" hint={<Delta current={kpis.revenue30d} previous={kpis.revenuePrev30d} />} />
        <StatTile label="مشترکین پولی فعال" value={kpis.activePaid} icon={<Crown size={20} variant="Bold" />} tone="warning" hint={`${formatNumberFa(kpis.payments30d)} خرید در ۳۰ روز اخیر`} />
        <StatTile label="دوره‌های آزمایشی فعال" value={kpis.activeTrials} icon={<Flash size={20} variant="Bold" />} tone="info" hint={`${formatNumberFa(kpis.trialConversion.trials)} آزمایشی در بازهٔ ${rangeLabel}`} />
        <StatTile label="ریزش ۳۰ روز اخیر" value={kpis.churned30d} icon={<TrendDown size={20} variant="Bold" />} tone={kpis.churned30d ? "danger" : "neutral"} hint={`نرخ ریزش ${formatRateFa(kpis.churnRate30d)}`} />
        <StatTile label="تبدیل آزمایشی ← پولی" value={formatRateFa(kpis.trialConversion.rate)} icon={<Chart size={20} variant="Bold" />} tone="accent" hint={`${formatNumberFa(kpis.trialConversion.converted)} از ${formatNumberFa(kpis.trialConversion.trials)} کاربر · ${rangeLabel}`} />
        <button type="button" className="cursor-pointer text-start" onClick={onOpenRequests}>
          <StatTile label="درخواست‌های در انتظار" value={kpis.pending} icon={<Clock size={20} variant="Bold" />} tone={kpis.pending ? "danger" : "neutral"} hint={kpis.pending ? "برای بررسی کلیک کنید" : "همه بررسی شده‌اند"} />
        </button>
        <button type="button" className="cursor-pointer text-start" onClick={onOpenExpiring}>
          <StatTile label="انقضا تا ۷ روز آینده" value={kpis.expiringSoon} icon={<Timer1 size={20} variant="Bold" />} tone="info" hint="فرصت پیگیری برای تمدید" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={<ReceiptMinus size={18} />} label="میانگین مبلغ هر خرید (۳۰ روز)" value={formatTomanFa(kpis.averageOrder30d)} />
        <MiniStat icon={<DiscountShape size={18} />} label="تخفیف داده‌شده (۳۰ روز)" value={formatTomanFa(kpis.discount30d.discountToman)} hint={`${formatNumberFa(kpis.discount30d.redemptions)} استفاده از کد`} />
        <MiniStat icon={<MoneyRecive size={18} />} label="بازپرداخت ثبت‌شده (۳۰ روز)" value={formatTomanFa(kpis.refunds30d)} />
        <MiniStat icon={<Profile2User size={18} />} label={`درآمد کل بازهٔ ${rangeLabel}`} value={formatTomanFa(kpis.revenueInRange)} />
      </div>

      <AdminPanel
        title="درآمد در طول زمان"
        description="مبلغ دریافتی از خریدهای بله، کافه‌بازار و درخواست‌های تأییدشده (بعد از تخفیف)."
        actions={
          <div className="flex items-center gap-2">
            <SegmentedTabs size="sm" items={RANGES.map((range) => ({ id: range.id, label: range.label }))} value={days} onChange={setDays} />
            <Button isIconOnly size="sm" variant="ghost" aria-label="به‌روزرسانی" isPending={loading} onPress={() => void load()}>
              <Refresh2 size={16} />
            </Button>
          </div>
        }
      >
        <RevenueChart series={data.series} days={data.range.days} />
      </AdminPanel>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AdminPanel title="اشتراک‌های پولی جدید در برابر ریزش" description="ریزش یعنی پایان آخرین اشتراک پولی کاربر بدون تمدید یا خرید بعدی.">
          <GrowthChart series={data.series} days={data.range.days} />
        </AdminPanel>
        <AdminPanel title="ترکیب پلن‌ها" description="مشترکین پولی فعال در هر پلن.">
          <PlanMixList planMix={data.planMix} />
        </AdminPanel>
      </div>

      <AdminPanel title="کانال‌های فروش" description="اشتراک‌های پولی فعال به تفکیک روش خرید.">
        <SourceMixBar sourceMix={data.sourceMix} revenueBySource={data.revenueBySource30d} />
      </AdminPanel>

      <p className="text-center text-[11px] text-muted">به‌روزرسانی: {formatDateTimeFa(data.generatedAt)}</p>
    </div>
  );
}
