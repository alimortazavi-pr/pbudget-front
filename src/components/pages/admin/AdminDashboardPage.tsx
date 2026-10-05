"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  Activity,
  ArrowLeft2,
  Crown,
  Danger,
  Data,
  Flash,
  People,
  Profile2User,
  Radar,
  Refresh2,
  ReceiptText,
  UserAdd,
} from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import * as insightsApi from "@/common/api/admin-insights";
import * as subscriptionApi from "@/common/api/subscriptions";
import { PATHS } from "@/common/constants";
import type {
  AdminActivityItem,
  AdminActivitySeries,
  AdminEngagement,
  AdminHealth,
  AdminOverview,
} from "@/common/interfaces/admin";
import { formatBytes, formatUptime } from "@/common/utils/admin-format";
import { showErrorToast } from "@/common/utils/toast";
import { ActivityList } from "./AdminActivityFeed";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  KeyValue,
  Pill,
  PresenceDot,
  SkeletonRows,
  StatTile,
  UserAvatar,
} from "./ui/AdminUi";
import { formatNumberFa, formatPercentFa, formatRelativeFa } from "./ui/admin-format";

const AdminTrendChart = dynamic(() => import("./AdminTrendChart").then((mod) => mod.AdminTrendChart), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-surface-secondary" />,
});

type SubscriptionSummary = { paidActive: number; pending: number; expiringSoon: number; expiredThisMonth: number };

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [engagement, setEngagement] = useState<AdminEngagement | null>(null);
  const [activity, setActivity] = useState<AdminActivitySeries | null>(null);
  const [feed, setFeed] = useState<AdminActivityItem[] | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [subs, setSubs] = useState<SubscriptionSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const results = await Promise.allSettled([
      adminApi.fetchAdminOverview(),
      insightsApi.fetchEngagement(),
      adminApi.fetchAdminActivity(30),
      insightsApi.fetchGlobalActivity({ limit: 12 }),
      adminApi.fetchAdminHealth(),
      subscriptionApi.fetchAdminSubscriptionsFiltered({ limit: 1 }),
    ]);
    const [o, e, a, f, h, s] = results;
    if (o.status === "fulfilled") setOverview(o.value);
    if (e.status === "fulfilled") setEngagement(e.value);
    if (a.status === "fulfilled") setActivity(a.value);
    if (f.status === "fulfilled") setFeed(f.value.items);
    if (h.status === "fulfilled") setHealth(h.value);
    if (s.status === "fulfilled") setSubs(s.value.summary);
    const failed = results.find((item) => item.status === "rejected");
    if (failed && failed.status === "rejected") showErrorToast(failed.reason, "بخشی از داشبورد بارگذاری نشد");
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void load();
    // Keep the live numbers fresh while the dashboard stays open.
    const timer = window.setInterval(() => {
      void insightsApi.fetchGlobalActivity({ limit: 12 }).then((res) => setFeed(res.items)).catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const users = engagement?.users;
  const loading = !overview && !engagement;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="نمای کلی"
        description="هر آنچه در میز پردیس می‌گذرد: کاربران فعال، اشتراک‌ها، رفتار کاربران و سلامت سیستم."
        icon={<Radar size={24} variant="Bold" />}
        actions={
          <Button variant="secondary" size="sm" isPending={refreshing} onPress={() => void load()}>
            <Refresh2 size={16} />
            به‌روزرسانی
          </Button>
        }
      />

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-surface-secondary" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="کل کاربران"
            value={formatNumberFa(users?.total ?? overview?.users.total ?? 0)}
            hint={`${formatNumberFa(overview?.users.newToday ?? 0)} امروز · ${formatNumberFa(overview?.users.newThisWeek ?? 0)} این هفته`}
            icon={<People size={20} variant="Bold" />}
            href={PATHS.ADMIN_USERS}
          />
          <StatTile
            label="فعال امروز"
            value={formatNumberFa(users?.dau ?? 0)}
            hint={`هفته ${formatNumberFa(users?.wau ?? 0)} · ماه ${formatNumberFa(users?.mau ?? 0)}`}
            icon={<Flash size={20} variant="Bold" />}
            tone="success"
          />
          <StatTile
            label="تراکنش‌های امروز"
            value={formatNumberFa(overview?.transactions.today ?? 0)}
            hint={`${formatNumberFa(overview?.transactions.thisWeek ?? 0)} این هفته · ${formatNumberFa(overview?.transactions.total ?? 0)} کل`}
            icon={<ReceiptText size={20} variant="Bold" />}
            tone="info"
          />
          <StatTile
            label="مشترکین پولی"
            value={formatNumberFa(subs?.paidActive ?? 0)}
            hint={
              subs?.pending ? (
                <span className="font-semibold text-warning-foreground">{formatNumberFa(subs.pending)} درخواست در انتظار</span>
              ) : (
                `${formatNumberFa(subs?.expiringSoon ?? 0)} در ۷ روز آینده منقضی می‌شوند`
              )
            }
            icon={<Crown size={20} variant="Bold" />}
            tone="warning"
            href={PATHS.ADMIN_SUBSCRIPTIONS}
          />
          <StatTile
            label="هرگز استفاده نکرده‌اند"
            value={formatNumberFa(users?.neverSeen ?? 0)}
            hint="ثبت‌نام کرده ولی وارد اپ نشده‌اند"
            icon={<UserAdd size={20} />}
            tone="neutral"
            href={`${PATHS.ADMIN_USERS}?segment=never`}
          />
          <StatTile
            label="غیرفعال بیش از ۳۰ روز"
            value={formatNumberFa(users?.dormant ?? 0)}
            hint="فرصت پیگیری و بازگرداندن"
            icon={<Profile2User size={20} />}
            tone="neutral"
            href={`${PATHS.ADMIN_USERS}?segment=inactive`}
          />
          <StatTile
            label="تلگرام متصل"
            value={formatNumberFa(users?.telegram ?? 0)}
            hint={users?.total ? `${formatPercentFa(((users.telegram ?? 0) / users.total) * 100)} کاربران` : undefined}
            icon={<Activity size={20} />}
            tone="accent"
          />
          <StatTile
            label="خطاهای سرور (۲۴ ساعت)"
            value={formatNumberFa(engagement?.health.errors24h ?? 0)}
            hint={`از ${formatNumberFa(engagement?.health.requests24h ?? 0)} درخواست`}
            icon={<Danger size={20} variant="Bold" />}
            tone={(engagement?.health.errors24h ?? 0) > 0 ? "danger" : "success"}
            href={`${PATHS.ADMIN_ACTIVITY}?errors=1`}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminPanel
          title="روند ۳۰ روز گذشته"
          description="کاربران جدید و تراکنش‌های ثبت‌شده در هر روز"
          actions={
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" />تراکنش</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-violet-500" />کاربر جدید</span>
            </div>
          }
        >
          {activity ? <AdminTrendChart activity={activity} /> : <div className="h-64 animate-pulse rounded-xl bg-surface-secondary" />}
        </AdminPanel>

        <AdminPanel
          title="فعالیت زنده"
          description="آخرین کارهایی که کاربران انجام داده‌اند"
          actions={
            <Link href={PATHS.ADMIN_ACTIVITY} className="flex items-center gap-1 text-xs font-semibold text-accent">
              همه
              <ArrowLeft2 size={14} />
            </Link>
          }
          bodyClassName="px-4 sm:px-5"
        >
          {!feed ? (
            <div className="py-4"><SkeletonRows rows={6} height="h-11" /></div>
          ) : feed.length === 0 ? (
            <div className="py-6"><EmptyState title="هنوز فعالیتی ثبت نشده" /></div>
          ) : (
            <div className="max-h-[22rem] overflow-y-auto"><ActivityList items={feed} /></div>
          )}
        </AdminPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminPanel title="استفاده از امکانات" description="چند درصد کاربران از هر بخش استفاده کرده‌اند">
          {!engagement ? (
            <SkeletonRows rows={6} height="h-8" />
          ) : (
            <ul className="space-y-3">
              {engagement.adoption.map((item) => (
                <li key={item.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted tabular-nums">
                      {formatNumberFa(item.users)} کاربر · {formatPercentFa(item.share)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                    <div className="h-full rounded-full bg-gradient-to-l from-accent to-violet-400" style={{ width: `${Math.min(100, item.share)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel title="پرتکرارترین کارها" description="عملیات کاربران در ۷ روز گذشته">
          {!engagement ? (
            <SkeletonRows rows={6} height="h-8" />
          ) : engagement.topActions.length === 0 ? (
            <EmptyState title="در این هفته عملیاتی ثبت نشده" />
          ) : (
            <ol className="space-y-2">
              {engagement.topActions.map((action, index) => (
                <li key={action.label} className="flex items-center gap-3 rounded-xl bg-surface-secondary/50 px-3 py-2">
                  <span className="w-5 text-center text-xs font-bold text-muted tabular-nums">{formatNumberFa(index + 1)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{action.label}</p>
                    <p className="text-[11px] text-muted">{action.featureLabel}</p>
                  </div>
                  <div className="text-end text-xs tabular-nums">
                    <p className="font-bold">{formatNumberFa(action.count)} بار</p>
                    <p className="text-muted">{formatNumberFa(action.users)} کاربر</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </AdminPanel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <AdminPanel title="فعال‌ترین کاربران" description="بیشترین تراکنش در ۳۰ روز گذشته">
          {!engagement ? (
            <SkeletonRows rows={5} />
          ) : engagement.topUsers.length === 0 ? (
            <EmptyState title="هنوز تراکنشی ثبت نشده" />
          ) : (
            <ul className="divide-y divide-border/50">
              {engagement.topUsers.map((user) => (
                <li key={user._id}>
                  <Link href={PATHS.ADMIN_USER(user._id)} className="flex items-center gap-3 py-2.5 hover:text-accent">
                    <UserAvatar name={user.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="flex items-center gap-2 text-xs text-muted">
                        <span dir="ltr">{user.mobile}</span>
                        <PresenceDot lastSeenAt={user.lastSeenAt} />
                        {formatRelativeFa(user.lastSeenAt)}
                      </p>
                    </div>
                    <Pill tone="accent">{formatNumberFa(user.transactions30d)} تراکنش</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel
          title="سلامت سیستم"
          actions={
            health ? (
              <Pill tone={health.status === "healthy" ? "success" : "warning"}>
                {health.status === "healthy" ? "سالم" : "نیازمند بررسی"}
              </Pill>
            ) : null
          }
        >
          {!health || !overview ? (
            <SkeletonRows rows={5} height="h-8" />
          ) : (
            <div>
              <KeyValue label="مدت روشن بودن">{formatUptime(health.uptimeSeconds)}</KeyValue>
              <KeyValue label="پایگاه داده">
                {health.mongodb.status === "connected" ? "متصل" : "قطع"}
                {health.mongodb.latencyMs != null ? ` · ${formatNumberFa(health.mongodb.latencyMs)}ms` : ""}
              </KeyValue>
              <KeyValue label="حجم داده">{formatBytes(overview.database.totalSizeBytes)}</KeyValue>
              <KeyValue label="تعداد اسناد">{formatNumberFa(overview.database.documents)}</KeyValue>
              <KeyValue label="حافظه سرور">{formatBytes(health.memory.rssBytes)}</KeyValue>
              <KeyValue label="بکاپ تلگرام">{health.backup.telegramEnabled ? "فعال" : "غیرفعال"}</KeyValue>
              <Link href={PATHS.ADMIN_DATABASE} className="mt-3 flex items-center gap-2 text-sm font-semibold text-accent">
                <Data size={16} />
                مدیریت دیتابیس
              </Link>
            </div>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
