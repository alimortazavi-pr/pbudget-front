"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Switch, TextArea } from "@heroui/react";
import { Add, Archive, Clock, Crown, Edit2, Flash, TickCircle, Timer1 } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import * as subscriptionApi from "@/common/api/subscriptions";
import type { AdminSubscriptionStatusFilter, FeatureDefinition } from "@/common/api/subscriptions";
import { PATHS } from "@/common/constants";
import type { AdminUserRow } from "@/common/interfaces/admin";
import type { SubscriptionFeature, SubscriptionPeriod, SubscriptionPlan, UserSubscription } from "@/common/interfaces/subscription.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormField, FormGrid, FormSection, SwitchRow } from "@/components/common/form/FormKit";
import {
  AdminPageHeader,
  AdminPanel,
  ConfirmDialog,
  EmptyState,
  Field,
  FormDialog,
  NativeSelect,
  PaginationBar,
  Pill,
  SearchField,
  SegmentedTabs,
  SkeletonRows,
  StatTile,
  UserAvatar,
} from "./ui/AdminUi";
import { formatDateFa, formatNumberFa, formatRelativeFa } from "./ui/admin-format";
import { SUBSCRIPTION_PERIOD_LABEL, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE } from "./subscription-labels";

type Tab = "requests" | "subscribers" | "plans" | "payments";
type Summary = { paidActive: number; pending: number; expiringSoon: number; expiredThisMonth: number };
type ListResponse = Awaited<ReturnType<typeof subscriptionApi.fetchAdminSubscriptionsFiltered>>;

const STATUS_FILTERS: { value: AdminSubscriptionStatusFilter; label: string }[] = [
  { value: "current", label: "در حال حاضر فعال" },
  { value: "expiring", label: "در ۷ روز آینده منقضی می‌شوند" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
  { value: "expired", label: "منقضی‌شده" },
  { value: "canceled", label: "لغوشده" },
  { value: "", label: "همه" },
];

function userName(subscription: UserSubscription) {
  return `${subscription.user?.firstName ?? ""} ${subscription.user?.lastName ?? ""}`.trim() || "کاربر حذف‌شده";
}

export function AdminSubscriptionsPage() {
  const [tab, setTab] = useState<Tab>("subscribers");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      setPlans(await subscriptionApi.fetchAdminSubscriptionPlans());
    } catch (error) {
      showErrorToast(error);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const result = await subscriptionApi.fetchAdminSubscriptionsFiltered({ limit: 1 });
      setSummary(result.summary);
      if (result.summary.pending > 0) setTab((current) => (current === "subscribers" ? "requests" : current));
    } catch (error) {
      showErrorToast(error);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
    void loadSummary();
  }, [loadPlans, loadSummary]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadSummary(), loadPlans()]);
  }, [loadPlans, loadSummary]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="اشتراک‌ها"
        description="درخواست‌های ارتقا را تأیید کنید، اشتراک‌ها را تمدید یا لغو کنید و پلن‌ها و قابلیت‌هایشان را تعریف کنید."
        icon={<Crown size={24} variant="Bold" />}
        actions={
          <Button size="sm" onPress={() => setAssignOpen(true)}>
            <Flash size={16} />
            فعال‌سازی دستی
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="مشترکین پولی فعال" value={formatNumberFa(summary?.paidActive ?? 0)} icon={<Crown size={20} variant="Bold" />} tone="warning" />
        <StatTile label="درخواست‌های در انتظار" value={formatNumberFa(summary?.pending ?? 0)} icon={<Clock size={20} variant="Bold" />} tone={summary?.pending ? "danger" : "neutral"} />
        <StatTile label="انقضا تا ۷ روز آینده" value={formatNumberFa(summary?.expiringSoon ?? 0)} icon={<Timer1 size={20} variant="Bold" />} tone="info" />
        <StatTile label="منقضی‌شده در ۳۰ روز اخیر" value={formatNumberFa(summary?.expiredThisMonth ?? 0)} icon={<Archive size={20} />} tone="neutral" />
      </div>

      <SegmentedTabs
        items={[
          { id: "requests" as const, label: "درخواست‌ها", count: summary?.pending },
          { id: "subscribers" as const, label: "مشترکین" },
          { id: "plans" as const, label: "پلن‌ها", count: plans.length },
          { id: "payments" as const, label: "پرداخت‌های بله" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "requests" ? <RequestsTab onChanged={refreshAll} /> : null}
      {tab === "subscribers" ? <SubscribersTab plans={plans} onChanged={refreshAll} /> : null}
      {tab === "payments" ? <BalePaymentsTab /> : null}
      {tab === "plans" ? <PlansTab plans={plans} onChanged={refreshAll} /> : null}

      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} plans={plans} onDone={refreshAll} />
    </div>
  );
}

function BalePaymentsTab() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof subscriptionApi.fetchAdminBalePayments>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    subscriptionApi
      .fetchAdminBalePayments({ status, page })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((error) => showErrorToast(error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="پرداخت موفق (کل)" value={formatNumberFa(data?.summary.paidCount ?? 0)} tone="success" icon={<TickCircle size={20} variant="Bold" />} />
        <StatTile label="جمع دریافتی (تومان)" value={formatNumberFa(Math.round((data?.summary.paidRial ?? 0) / 10))} tone="accent" icon={<Crown size={20} variant="Bold" />} />
      </div>
      <AdminPanel
        title="پرداخت‌های کیف پول بله"
        description="هر ردیف یک تلاش پرداخت است. «در انتظار» یعنی هنوز در بله پرداخت نشده؛ پرداخت‌های ناتمام بعد از ۳۰ دقیقه بی‌اثر می‌شوند."
        actions={
          <SegmentedTabs
            size="sm"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            items={[
              { id: "", label: "همه" },
              { id: "paid", label: "پرداخت‌شده" },
              { id: "pending", label: "در انتظار" },
            ]}
          />
        }
      >
        {loading && !data ? (
          <SkeletonRows rows={4} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="هنوز پرداختی ثبت نشده" />
        ) : (
          <ul className="divide-y divide-border/50">
            {data.items.map((item) => (
              <li key={item._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {`${item.user?.firstName ?? ""} ${item.user?.lastName ?? ""}`.trim() || "—"}{" "}
                    <span className="text-xs font-normal text-muted" dir="ltr">{item.user?.mobile}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {item.plan?.name ?? "—"} · {formatNumberFa(item.amountPlanUnit)} تومان · {formatDateFa(item.paidAt ?? item.createdAt)}
                    {item.providerChargeId ? <span dir="ltr"> · {item.providerChargeId}</span> : null}
                  </p>
                </div>
                {item.status === "paid" ? (
                  <Pill tone={item.subscription ? "success" : "danger"}>{item.subscription ? "پرداخت شد و فعال است" : "پرداخت شد؛ فعال‌سازی ناتمام"}</Pill>
                ) : (
                  <Pill tone="warning">در انتظار پرداخت</Pill>
                )}
              </li>
            ))}
          </ul>
        )}
        <PaginationBar pagination={data?.pagination} onPage={setPage} />
      </AdminPanel>
    </div>
  );
}

function RequestsTab({ onChanged }: { onChanged: () => Promise<void> }) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<UserSubscription | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await subscriptionApi.fetchAdminSubscriptionsFiltered({ status: "pending", limit: 50 }));
    } catch (error) {
      showErrorToast(error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function act(id: string, action: () => Promise<unknown>, message: string) {
    setBusyId(id);
    try {
      await action();
      showToast(message, "success");
      setRejecting(null);
      await Promise.all([load(), onChanged()]);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusyId(null);
    }
  }

  if (!data) return <SkeletonRows rows={3} height="h-24" />;
  if (data.items.length === 0) {
    return <EmptyState icon={<TickCircle size={36} />} title="درخواستی در انتظار نیست" description="وقتی کاربری از صفحه پلن‌ها درخواست ارتقا بدهد، اینجا و در تلگرام ادمین باخبر می‌شوید." />;
  }

  return (
    <div className="space-y-3">
      {data.items.map((item) => (
        <div key={item._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-warning/40 bg-surface p-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={userName(item)} />
            <div className="min-w-0">
              <p className="font-semibold">
                {item.user?._id ? <Link href={PATHS.ADMIN_USER(item.user._id)} className="hover:text-accent">{userName(item)}</Link> : userName(item)}
                <span className="ms-2 text-xs font-normal text-muted" dir="ltr">{item.user?.mobile}</span>
              </p>
              <p className="mt-0.5 text-sm">
                درخواست پلن <span className="font-semibold">{item.plan?.name ?? item.planSnapshot?.name}</span>
                <span className="text-xs text-muted"> · {formatRelativeFa(item.createdAt)}</span>
              </p>
              {item.requestNote ? <p className="mt-1 text-xs text-muted">«{item.requestNote}»</p> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" isDisabled={busyId === item._id} onPress={() => { setRejectNote(""); setRejecting(item); }}>
              رد
            </Button>
            <Button size="sm" isPending={busyId === item._id} onPress={() => void act(item._id, () => subscriptionApi.approveSubscriptionRequest(item._id), "اشتراک فعال شد و به کاربر اطلاع داده شد")}>
              <TickCircle size={16} />
              تأیید و فعال‌سازی
            </Button>
          </div>
        </div>
      ))}

      <FormDialog
        open={Boolean(rejecting)}
        onOpenChange={(open) => !open && setRejecting(null)}
        title="رد درخواست"
        description="در صورت اتصال تلگرام، این توضیح برای کاربر ارسال می‌شود."
        submitLabel="رد درخواست"
        isPending={Boolean(rejecting && busyId === rejecting._id)}
        onSubmit={() => rejecting && void act(rejecting._id, () => subscriptionApi.rejectSubscriptionRequest(rejecting._id, { note: rejectNote }), "درخواست رد شد")}
      >
        <Field label="توضیح (اختیاری)">
          <TextArea variant="secondary" rows={3} value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} />
        </Field>
      </FormDialog>
    </div>
  );
}

function SubscribersTab({ plans, onChanged }: { plans: SubscriptionPlan[]; onChanged: () => Promise<void> }) {
  const [status, setStatus] = useState<AdminSubscriptionStatusFilter>("current");
  const [planId, setPlanId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<UserSubscription | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await subscriptionApi.fetchAdminSubscriptionsFiltered({ page, limit: 20, search, status, planId }));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, [page, planId, search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      showToast(message, "success");
      setRevoking(null);
      await Promise.all([load(), onChanged()]);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanel bodyClassName="p-4 sm:p-5 space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_12rem]">
        <SearchField value={search} placeholder="نام یا موبایل کاربر…" onChange={(value) => { setSearch(value); setPage(1); }} />
        <NativeSelect ariaLabel="وضعیت" value={status} onChange={(value) => { setStatus(value as AdminSubscriptionStatusFilter); setPage(1); }} options={STATUS_FILTERS} />
        <NativeSelect ariaLabel="پلن" value={planId} onChange={(value) => { setPlanId(value); setPage(1); }} options={[{ value: "", label: "همه پلن‌ها" }, ...plans.map((plan) => ({ value: plan._id, label: plan.name }))]} />
      </div>

      {loading && !data ? (
        <SkeletonRows rows={6} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="اشتراکی با این فیلتر پیدا نشد" />
      ) : (
        <div className={loading ? "opacity-60" : ""}>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-surface-secondary/60 text-xs text-muted">
                <tr>
                  <th className="px-3 py-2.5 text-start font-medium">کاربر</th>
                  <th className="px-3 py-2.5 text-start font-medium">پلن</th>
                  <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2.5 text-start font-medium">شروع</th>
                  <th className="px-3 py-2.5 text-start font-medium">انقضا</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const isFree = (item.plan?.slug ?? item.planSnapshot?.slug) === "free";
                  const live = item.status === "active";
                  return (
                    <tr key={item._id} className="border-t border-border/50">
                      <td className="px-3 py-2.5">
                        {item.user?._id ? (
                          <Link href={`${PATHS.ADMIN_USER(item.user._id)}?tab=subscription`} className="font-semibold hover:text-accent">
                            {userName(item)}
                          </Link>
                        ) : (
                          userName(item)
                        )}
                        <p className="text-xs text-muted" dir="ltr">{item.user?.mobile}</p>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{item.plan?.name ?? item.planSnapshot?.name}</td>
                      <td className="px-3 py-2.5">
                        <Pill tone={SUBSCRIPTION_STATUS_TONE[item.status]}>{SUBSCRIPTION_STATUS_LABEL[item.status]}</Pill>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{formatDateFa(item.startsAt)}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {item.expiresAt ? (
                          <>
                            {formatDateFa(item.expiresAt)}
                            {live ? <span className="block text-muted">{formatRelativeFa(item.expiresAt)}</span> : null}
                          </>
                        ) : (
                          "نامحدود"
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {live && !isFree ? (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => void run(() => subscriptionApi.updateAdminSubscription(item._id, { extendDays: 30 }), "۳۰ روز تمدید شد")}>
                              +۳۰ روز
                            </Button>
                            <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => setRevoking(item)}>
                              لغو
                            </Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar pagination={data.pagination} onPage={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="لغو اشتراک"
        description={revoking ? `اشتراک «${revoking.plan?.name ?? revoking.planSnapshot?.name}» برای ${userName(revoking)} همین حالا لغو و کاربر به پلن رایگان منتقل می‌شود.` : null}
        confirmLabel="لغو اشتراک"
        isPending={busy}
        onConfirm={() => revoking && void run(() => subscriptionApi.revokeAdminSubscription(revoking._id), "اشتراک لغو شد")}
      />
    </AdminPanel>
  );
}

function AssignDialog({
  open,
  onOpenChange,
  plans,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SubscriptionPlan[];
  onDone: () => Promise<void>;
}) {
  const activePlans = useMemo(() => plans.filter((plan) => plan.active), [plans]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserRow[]>([]);
  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [planId, setPlanId] = useState("");
  const [days, setDays] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setUser(null);
    setDays("");
    setNote("");
    setPlanId(activePlans.find((plan) => plan.slug !== "free")?._id ?? activePlans[0]?._id ?? "");
  }, [open, activePlans]);

  useEffect(() => {
    if (!open || query.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    void insightsApi
      .fetchUsers({ search: query, limit: 8, segment: "active" })
      .then((response) => !cancelled && setResults(response.items))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  async function submit() {
    if (!user || !planId) {
      showToast("کاربر و پلن را انتخاب کنید", "warning");
      return;
    }
    const duration = Number(days);
    setSaving(true);
    try {
      await subscriptionApi.assignAdminSubscription({
        userId: user._id,
        planId,
        expiresAt: days.trim() && duration > 0 ? new Date(Date.now() + duration * 86_400_000).toISOString() : undefined,
        note: note.trim() || undefined,
      });
      showToast("اشتراک فعال شد", "success");
      onOpenChange(false);
      await onDone();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title="فعال‌سازی دستی اشتراک" description="پلن فعلی کاربر لغو و پلن جدید از همین لحظه فعال می‌شود." isPending={saving} submitDisabled={!user || !planId} onSubmit={() => void submit()} submitLabel="فعال‌سازی">
      {user ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
          <div className="flex items-center gap-3">
            <UserAvatar name={`${user.firstName} ${user.lastName}`} size={34} />
            <div>
              <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted" dir="ltr">{user.mobile}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onPress={() => setUser(null)}>تغییر</Button>
        </div>
      ) : (
        <div className="space-y-2">
          <SearchField value={query} placeholder="جستجوی کاربر با نام یا موبایل…" onChange={setQuery} delay={250} />
          {results.length ? (
            <ul className="max-h-56 divide-y divide-border/50 overflow-y-auto rounded-xl border border-border/60">
              {results.map((row) => (
                <li key={row._id}>
                  <button type="button" className="flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-start hover:bg-surface-secondary" onClick={() => setUser(row)}>
                    <UserAvatar name={`${row.firstName} ${row.lastName}`} size={30} />
                    <span className="text-sm">{row.firstName} {row.lastName}</span>
                    <span className="ms-auto text-xs text-muted" dir="ltr">{row.mobile}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <p className="text-xs text-muted">کاربری پیدا نشد</p>
          ) : null}
        </div>
      )}
      <Field label="پلن">
        <NativeSelect ariaLabel="پلن" value={planId} onChange={setPlanId} options={activePlans.map((plan) => ({ value: plan._id, label: `${plan.name} · ${SUBSCRIPTION_PERIOD_LABEL[plan.period] ?? plan.period}` }))} />
      </Field>
      <Field label="مدت به روز (اختیاری)" hint="خالی = مدت پیش‌فرض پلن">
        <Input variant="secondary" dir="ltr" inputMode="numeric" value={days} onChange={(event) => setDays(event.target.value)} />
      </Field>
      <Field label="یادداشت (اختیاری)">
        <Input variant="secondary" value={note} placeholder="مثلاً: پرداخت کارت به کارت" onChange={(event) => setNote(event.target.value)} />
      </Field>
    </FormDialog>
  );
}

type PlanForm = {
  slug: string;
  name: string;
  description: string;
  price: string;
  priceUnit: string;
  period: SubscriptionPeriod;
  periodDays: string;
  highlighted: boolean;
  active: boolean;
  sortOrder: string;
  contactMessage: string;
  features: SubscriptionFeature[];
};

function toForm(plan?: SubscriptionPlan | null): PlanForm {
  if (!plan) {
    return {
      slug: "",
      name: "",
      description: "",
      price: "0",
      priceUnit: "تومان",
      period: "monthly",
      periodDays: "30",
      highlighted: false,
      active: true,
      sortOrder: "0",
      contactMessage: "برای خرید و فعال‌سازی با ادمین تماس بگیرید.",
      features: [],
    };
  }
  return {
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    priceUnit: plan.priceUnit,
    period: plan.period,
    periodDays: String(plan.periodDays ?? ""),
    highlighted: plan.highlighted,
    active: plan.active,
    sortOrder: String(plan.sortOrder),
    contactMessage: plan.contactMessage,
    features: plan.features.map((feature) => ({ ...feature })),
  };
}

function PlansTab({ plans, onChanged }: { plans: SubscriptionPlan[]; onChanged: () => Promise<void> }) {
  const [editing, setEditing] = useState<{ open: boolean; plan: SubscriptionPlan | null }>({ open: false, plan: null });
  const [archiving, setArchiving] = useState<SubscriptionPlan | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onPress={() => setEditing({ open: true, plan: null })}>
          <Add size={16} />
          پلن جدید
        </Button>
      </div>
      {plans.length === 0 ? (
        <SkeletonRows rows={2} height="h-48" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan._id} className={`flex flex-col rounded-2xl border p-5 ${plan.active ? "border-border/60 bg-surface" : "border-dashed border-border bg-surface-secondary/40 opacity-75"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-bold">
                    {plan.name}
                    {plan.highlighted ? <Pill tone="warning">پیشنهادی</Pill> : null}
                  </h3>
                  <p className="mt-0.5 font-mono text-[11px] text-muted" dir="ltr">{plan.slug}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Pill tone={plan.active ? "success" : "neutral"}>{plan.active ? "فعال" : "بایگانی"}</Pill>
                  {plan.isFallback ? <Pill tone="info">پلن پیش‌فرض</Pill> : null}
                </div>
              </div>
              <p className="mt-4 text-2xl font-extrabold">
                {plan.price ? `${formatNumberFa(plan.price)} ${plan.priceUnit}` : "رایگان"}
                <span className="ms-1 text-xs font-normal text-muted">/ {SUBSCRIPTION_PERIOD_LABEL[plan.period]}{plan.period === "custom" ? ` ${formatNumberFa(plan.periodDays ?? 0)} روز` : ""}</span>
              </p>
              <p className="mt-2 min-h-10 text-sm leading-6 text-muted">{plan.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.features.map((feature) => (
                  <Pill key={feature.key} tone={feature.enabled ? "accent" : "neutral"} className={feature.enabled ? "" : "line-through"}>
                    {feature.label}
                  </Pill>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-5">
                <span className="text-xs text-muted">{formatNumberFa(plan.activeSubscribers ?? 0)} مشترک فعال</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onPress={() => setEditing({ open: true, plan })}>
                    <Edit2 size={15} />
                    ویرایش
                  </Button>
                  {plan.active && !plan.isFallback ? (
                    <Button size="sm" variant="ghost" onPress={() => setArchiving(plan)}>
                      <Archive size={15} />
                      بایگانی
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <PlanEditorDialog open={editing.open} plan={editing.plan} onOpenChange={(open) => setEditing((current) => ({ ...current, open }))} onSaved={onChanged} />

      <ConfirmDialog
        open={Boolean(archiving)}
        onOpenChange={(open) => !open && setArchiving(null)}
        title="بایگانی پلن"
        description={archiving ? `پلن «${archiving.name}» از صفحه قیمت‌ها حذف می‌شود و قابل خرید نیست. مشترکین فعلی تا پایان دوره‌شان دسترسی دارند.` : null}
        confirmLabel="بایگانی"
        isPending={busy}
        onConfirm={async () => {
          if (!archiving) return;
          setBusy(true);
          try {
            await subscriptionApi.archiveAdminSubscriptionPlan(archiving._id);
            showToast("پلن بایگانی شد", "success");
            setArchiving(null);
            await onChanged();
          } catch (error) {
            showErrorToast(error);
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function PlanEditorDialog({
  open,
  plan,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  plan: SubscriptionPlan | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<PlanForm>(() => toForm(null));
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<FeatureDefinition[]>([]);

  useEffect(() => {
    if (!open || catalog.length > 0) return;
    subscriptionApi.fetchAdminFeatureCatalog().then(setCatalog).catch((error) => showErrorToast(error));
  }, [open, catalog.length]);

  useEffect(() => {
    if (open) setForm(toForm(plan));
  }, [open, plan]);

  const update = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  function setFeature(key: string, patch: Partial<SubscriptionFeature>) {
    const definition = catalog.find((feature) => feature.key === key);
    setForm((current) => {
      const index = current.features.findIndex((feature) => feature.key === key);
      const next = [...current.features];
      if (index >= 0) next[index] = { ...next[index], ...patch };
      else next.push({ key, label: definition?.label ?? key, description: "", enabled: definition?.defaultEnabled ?? false, limit: null, ...patch });
      return { ...current, features: next };
    });
  }

  async function save() {
    if (!form.name.trim() || (!plan && !form.slug.trim())) {
      showToast("نام و شناسه پلن را وارد کنید", "warning");
      return;
    }
    // Save every catalog feature explicitly (missing ones keep their catalog default).
    const features = [
      ...catalog.map((definition) => form.features.find((feature) => feature.key === definition.key) ?? { key: definition.key, label: definition.label, description: "", enabled: definition.defaultEnabled, limit: null }),
      ...form.features.filter((feature) => !catalog.some((definition) => definition.key === feature.key)),
    ];
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      priceUnit: form.priceUnit.trim() || "تومان",
      period: form.period,
      periodDays: form.period === "custom" ? Number(form.periodDays) || null : undefined,
      highlighted: form.highlighted,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
      contactMessage: form.contactMessage.trim(),
      features,
    };
    setSaving(true);
    try {
      if (plan) await subscriptionApi.updateAdminSubscriptionPlan(plan._id, payload);
      else await subscriptionApi.createAdminSubscriptionPlan({ ...payload, slug: form.slug.trim().toLowerCase() } as Parameters<typeof subscriptionApi.createAdminSubscriptionPlan>[0]);
      showToast("پلن ذخیره شد", "success");
      onOpenChange(false);
      await onSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={plan ? `ویرایش پلن «${plan.name}»` : "پلن جدید"} wide isPending={saving} onSubmit={() => void save()} submitLabel="ذخیره پلن">
      <FormSection title="اطلاعات پلن" description="نامی که کاربر در صفحهٔ پلن‌ها می‌بیند.">
        <FormGrid>
          <FormField label="نام پلن" required>
            <Input variant="secondary" className="w-full" value={form.name} onChange={(event) => update("name", event.target.value)} />
          </FormField>
          <FormField label="شناسه (انگلیسی)" required={!plan} hint={plan ? "بعد از ساخت پلن تغییر نمی‌کند." : "مثلاً pro یا business-yearly"}>
            <Input variant="secondary" className="w-full" dir="ltr" value={form.slug} disabled={Boolean(plan)} onChange={(event) => update("slug", event.target.value)} />
          </FormField>
        </FormGrid>
        <FormField label="توضیح کوتاه" hint="یک یا دو جمله دربارهٔ مناسب‌بودن این پلن.">
          <TextArea variant="secondary" rows={2} className="w-full" value={form.description} onChange={(event) => update("description", event.target.value)} />
        </FormField>
      </FormSection>

      <FormSection title="قیمت و دوره">
        <FormGrid cols={3}>
          <FormField label="قیمت">
            <Input variant="secondary" className="w-full" dir="ltr" inputMode="numeric" value={form.price} onChange={(event) => update("price", event.target.value.replace(/[^\d]/g, ""))} />
          </FormField>
          <FormField label="واحد قیمت">
            <Input variant="secondary" className="w-full" value={form.priceUnit} onChange={(event) => update("priceUnit", event.target.value)} />
          </FormField>
          <FormField label="دورهٔ اشتراک">
            <NativeSelect ariaLabel="دوره" value={form.period} onChange={(value) => update("period", value as SubscriptionPeriod)} options={Object.entries(SUBSCRIPTION_PERIOD_LABEL).map(([value, label]) => ({ value, label }))} />
          </FormField>
        </FormGrid>
        <FormGrid>
          {form.period === "custom" ? (
            <FormField label="تعداد روز">
              <Input variant="secondary" className="w-full" dir="ltr" inputMode="numeric" value={form.periodDays} onChange={(event) => update("periodDays", event.target.value.replace(/[^\d]/g, ""))} />
            </FormField>
          ) : null}
          <FormField label="ترتیب نمایش" hint="عدد کمتر زودتر نمایش داده می‌شود.">
            <Input variant="secondary" className="w-full" dir="ltr" inputMode="numeric" value={form.sortOrder} onChange={(event) => update("sortOrder", event.target.value.replace(/[^\d-]/g, ""))} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="نمایش و فروش">
        <SwitchRow label="فعال و قابل خرید" description="اگر خاموش باشد، پلن در صفحهٔ پلن‌ها نمایش داده نمی‌شود." selected={form.active} isDisabled={plan?.isFallback} onChange={(selected) => update("active", selected)} />
        <SwitchRow label="پلن پیشنهادی (برجسته)" description="با نشان «پیشنهاد ویژه» بالای کارت پلن دیده می‌شود." selected={form.highlighted} onChange={(selected) => update("highlighted", selected)} />
        <FormField label="پیام راهنمای خرید" hint="زیر دکمهٔ خرید نمایش داده می‌شود.">
          <Input variant="secondary" className="w-full" value={form.contactMessage} onChange={(event) => update("contactMessage", event.target.value)} />
        </FormField>
      </FormSection>

      <FeatureMatrix catalog={catalog} features={form.features} onChange={setFeature} />
      {plan ? <p className="text-xs text-muted">آخرین تغییر روی مشترکین فعلی این پلن هم اعمال می‌شود.</p> : null}
    </FormDialog>
  );
}

function FeatureMatrix({
  catalog,
  features,
  onChange,
}: {
  catalog: FeatureDefinition[];
  features: SubscriptionFeature[];
  onChange: (key: string, patch: Partial<SubscriptionFeature>) => void;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, FeatureDefinition[]>();
    catalog.forEach((feature) => map.set(feature.group, [...(map.get(feature.group) ?? []), feature]));
    return [...map.entries()];
  }, [catalog]);
  const stateOf = (definition: FeatureDefinition) => {
    const configured = features.find((feature) => feature.key === definition.key);
    return { enabled: configured ? configured.enabled !== false : definition.defaultEnabled, limit: configured?.limit ?? null };
  };
  const enabledCount = catalog.filter((definition) => stateOf(definition).enabled).length;

  if (catalog.length === 0) return <SkeletonRows rows={4} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">قابلیت‌ها</p>
        <span className="text-xs text-muted">
          {formatNumberFa(enabledCount)} از {formatNumberFa(catalog.length)} قابلیت فعال
        </span>
      </div>
      {groups.map(([group, items]) => {
        const allOn = items.every((definition) => stateOf(definition).enabled);
        return (
          <section key={group} className="rounded-2xl border border-border/60">
            <header className="flex items-center justify-between gap-3 border-b border-border/50 bg-surface-secondary/60 px-3 py-2 text-sm font-semibold">
              {group}
              <Button size="sm" variant="ghost" onPress={() => items.forEach((definition) => onChange(definition.key, { enabled: !allOn, label: definition.label }))}>
                {allOn ? "خاموش‌کردن همه" : "روشن‌کردن همه"}
              </Button>
            </header>
            <ul className="divide-y divide-border/40">
              {items.map((definition) => {
                const state = stateOf(definition);
                return (
                  <li key={definition.key} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{definition.label}</p>
                      <p className="text-xs leading-5 text-muted">{definition.description}</p>
                      <p className="font-mono text-[10px] text-muted" dir="ltr">{definition.key}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {definition.limitLabel ? (
                        <Input
                          variant="secondary"
                          type="number"
                          min={1}
                          aria-label={definition.limitLabel}
                          placeholder={definition.limitLabel}
                          className="w-28"
                          disabled={!state.enabled}
                          value={state.limit === null ? "" : String(state.limit)}
                          onChange={(event) => onChange(definition.key, { limit: event.target.value === "" ? null : Math.max(1, Number(event.target.value) || 1), label: definition.label, enabled: state.enabled })}
                        />
                      ) : null}
                      <Switch aria-label={definition.label} size="sm" isSelected={state.enabled} onChange={(selected) => onChange(definition.key, { enabled: selected, label: definition.label })}>
                        <Switch.Control><Switch.Thumb /></Switch.Control>
                      </Switch>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
