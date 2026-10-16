"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Switch } from "@heroui/react";
import { Add, Copy, DiscountShape, Edit2, Eye, InfoCircle, MagicStar, MoneyRecive, TicketDiscount, Trash } from "iconsax-reactjs";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { AdminDiscountCode, AdminDiscountList, DiscountCodePayload, DiscountRedemptionRow, DiscountState, DiscountType } from "@/common/api/subscriptions";
import type { SubscriptionPlan } from "@/common/interfaces/subscription.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormField, FormGrid, FormSection, SwitchRow } from "@/components/common/form/FormKit";
import { AdminPanel, ConfirmDialog, EmptyState, FormDialog, NativeSelect, PaginationBar, Pill, SearchField, SkeletonRows, StatTile, type Tone } from "../ui/AdminUi";
import { formatDateFa, formatDateTimeFa, formatNumberFa, formatRelativeFa } from "../ui/admin-format";
import { JalaliDateField } from "./JalaliDateField";
import { formatPlanAmountFa, formatRateFa, formatTomanFa, formatTomanShortFa, randomDiscountCode } from "./subscription-format";

const NO_CAMPAIGN = "بدون کمپین";

const STATE_LABEL: Record<DiscountState, { label: string; tone: Tone }> = {
  live: { label: "فعال", tone: "success" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "info" },
  expired: { label: "منقضی", tone: "neutral" },
  exhausted: { label: "ظرفیت تکمیل", tone: "warning" },
  inactive: { label: "غیرفعال", tone: "danger" },
};

const STATUS_FILTERS = [
  { value: "", label: "همه کدها" },
  { value: "active", label: "فعال" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
  { value: "expired", label: "منقضی" },
  { value: "inactive", label: "غیرفعال" },
];

function describeValue(code: Pick<AdminDiscountCode, "type" | "value" | "maxDiscount">) {
  if (code.type === "percent") return `${formatNumberFa(code.value)}٪${code.maxDiscount ? ` (تا ${formatTomanFa(code.maxDiscount)})` : ""}`;
  return formatTomanFa(code.value);
}

/** Preview only — the server always prices the purchase itself. */
function previewPrice(plan: SubscriptionPlan, type: DiscountType, value: number, maxDiscount: number | null) {
  const rial = /ریال/.test(plan.priceUnit);
  const toUnit = (toman: number) => (rial ? toman * 10 : toman);
  let discount = type === "percent" ? (plan.price * Math.min(100, value)) / 100 : toUnit(value);
  if (type === "percent" && maxDiscount != null) discount = Math.min(discount, toUnit(maxDiscount));
  discount = Math.min(plan.price, Math.max(0, Math.round(discount)));
  return { discount, final: plan.price - discount };
}

export function DiscountsTab({ plans, createSignal }: { plans: SubscriptionPlan[]; createSignal: number }) {
  const [data, setData] = useState<AdminDiscountList | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [campaign, setCampaign] = useState("");
  const [editing, setEditing] = useState<{ open: boolean; code: AdminDiscountCode | null }>({ open: false, code: null });
  const [viewing, setViewing] = useState<AdminDiscountCode | null>(null);
  const [deleting, setDeleting] = useState<AdminDiscountCode | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await subscriptionApi.fetchAdminDiscounts({ search, status }));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (createSignal > 0) setEditing({ open: true, code: null });
  }, [createSignal]);

  const items = useMemo(() => (data?.items ?? []).filter((item) => !campaign || (item.campaign || NO_CAMPAIGN) === campaign), [data, campaign]);
  const campaignNames = useMemo(() => [...new Set((data?.items ?? []).map((item) => item.campaign).filter(Boolean))], [data]);

  async function toggle(code: AdminDiscountCode, active: boolean) {
    setBusyId(code._id);
    try {
      await subscriptionApi.setAdminDiscountActive(code._id, active);
      showToast(active ? "کد فعال شد" : "کد غیرفعال شد", "success");
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusyId(null);
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showToast("کد کپی شد", "success");
    } catch {
      showToast(`کپی ممکن نشد؛ کد: ${code}`, "warning");
    }
  }

  const totals = data?.totals;
  const discountShare = totals && totals.revenueToman + totals.discountToman > 0 ? totals.discountToman / (totals.revenueToman + totals.discountToman) : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="کدهای فعال" value={totals?.liveCodes ?? 0} icon={<TicketDiscount size={20} variant="Bold" />} tone="accent" hint={`از ${formatNumberFa(totals?.codes ?? 0)} کد ساخته‌شده`} />
        <StatTile label="استفادهٔ موفق" value={totals?.redemptions ?? 0} icon={<DiscountShape size={20} variant="Bold" />} tone="info" hint="خرید کامل‌شده با کد" />
        <StatTile label="فروش با کد تخفیف" value={formatTomanShortFa(totals?.revenueToman ?? 0)} icon={<MoneyRecive size={20} variant="Bold" />} tone="success" hint="مبلغ دریافتی پس از تخفیف" />
        <StatTile label="جمع تخفیف داده‌شده" value={formatTomanShortFa(totals?.discountToman ?? 0)} icon={<MagicStar size={20} variant="Bold" />} tone="warning" hint={`${formatRateFa(discountShare)} از فروش ناخالص کدها`} />
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/5 p-4 text-sm leading-7">
        <InfoCircle size={20} className="mt-1 shrink-0 text-accent" />
        <p>
          کدهای تخفیف روی <b>پرداخت با کیف پول بله</b> و <b>درخواست دستی اشتراک</b> اعمال می‌شوند و مبلغ همیشه روی سرور محاسبه می‌شود. قیمت خرید درون‌برنامه‌ای <b>کافه‌بازار</b> را خود بازار تعیین می‌کند، بنابراین کد تخفیف روی آن اثری ندارد.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <AdminPanel title="کمپین‌ها" description="عملکرد هر کمپین بازاریابی؛ برای دیدن کدهای یک کمپین روی آن کلیک کنید.">
          {!data ? (
            <SkeletonRows rows={2} height="h-24" />
          ) : data.campaigns.length === 0 ? (
            <EmptyState icon={<TicketDiscount size={32} />} title="هنوز کمپینی ندارید" description="اولین کد تخفیف را بسازید؛ کدها با نام کمپین گروه‌بندی می‌شوند." />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {data.campaigns.map((item) => {
                const selected = campaign === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setCampaign(selected ? "" : item.name)}
                    className={`cursor-pointer rounded-2xl border p-4 text-start transition ${selected ? "border-accent bg-accent/8 shadow-sm" : "border-border/60 bg-surface hover:border-accent/40"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold">{item.name}</p>
                      <Pill tone={item.activeCodes ? "success" : "neutral"}>{item.activeCodes ? `${formatNumberFa(item.activeCodes)} کد فعال` : "بدون کد فعال"}</Pill>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {formatNumberFa(item.codes)} کد
                      {item.startsAt || item.endsAt ? ` · ${item.startsAt ? formatDateFa(item.startsAt) : "از ابتدا"} تا ${item.endsAt ? formatDateFa(item.endsAt) : "بدون پایان"}` : ""}
                    </p>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-surface-secondary/70 px-2 py-1.5">
                        <dt className="text-[10px] text-muted">استفاده</dt>
                        <dd className="text-sm font-bold tabular-nums">{formatNumberFa(item.redemptions)}</dd>
                      </div>
                      <div className="rounded-lg bg-surface-secondary/70 px-2 py-1.5">
                        <dt className="text-[10px] text-muted">فروش</dt>
                        <dd className="text-sm font-bold tabular-nums">{formatTomanShortFa(item.revenueToman, false)}</dd>
                      </div>
                      <div className="rounded-lg bg-surface-secondary/70 px-2 py-1.5">
                        <dt className="text-[10px] text-muted">تخفیف</dt>
                        <dd className="text-sm font-bold tabular-nums">{formatTomanShortFa(item.discountToman, false)}</dd>
                      </div>
                    </dl>
                    {item.lastRedeemedAt ? <p className="mt-2 text-[11px] text-muted">آخرین استفاده {formatRelativeFa(item.lastRedeemedAt)}</p> : null}
                  </button>
                );
              })}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="استفاده از کدها" description="خریدهای کامل‌شده با کد در ۳۰ روز اخیر.">
          <RedemptionSpark daily={data?.daily ?? []} />
        </AdminPanel>
      </div>

      <AdminPanel
        title="کدهای تخفیف"
        description={campaign ? `کدهای کمپین «${campaign}»` : "همهٔ کدها با آمار استفاده"}
        actions={
          <Button size="sm" onPress={() => setEditing({ open: true, code: null })}>
            <Add size={16} />
            کد تخفیف جدید
          </Button>
        }
        bodyClassName="p-4 sm:p-5 space-y-4"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_14rem]">
          <SearchField value={search} placeholder="جستجوی کد، عنوان یا کمپین…" onChange={setSearch} />
          <NativeSelect ariaLabel="وضعیت کد" value={status} onChange={setStatus} options={STATUS_FILTERS} />
          <NativeSelect ariaLabel="کمپین" value={campaign} onChange={setCampaign} options={[{ value: "", label: "همه کمپین‌ها" }, ...(data?.campaigns ?? []).map((item) => ({ value: item.name, label: item.name }))]} />
        </div>

        {loading && !data ? (
          <SkeletonRows rows={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<TicketDiscount size={36} />}
            title="کد تخفیفی پیدا نشد"
            description="با کد تخفیف می‌توانید کمپین‌های نوروزی، خوش‌آمد کاربران جدید یا بازگرداندن مشتریان قدیمی را اجرا کنید."
            action={
              <Button size="sm" onPress={() => setEditing({ open: true, code: null })}>
                <Add size={16} />
                ساخت کد تخفیف
              </Button>
            }
          />
        ) : (
          <div className={`overflow-x-auto rounded-xl border border-border/60 ${loading ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-surface-secondary/60 text-xs text-muted">
                <tr>
                  <th className="px-3 py-2.5 text-start font-medium">کد</th>
                  <th className="px-3 py-2.5 text-start font-medium">تخفیف</th>
                  <th className="px-3 py-2.5 text-start font-medium">اعتبار</th>
                  <th className="px-3 py-2.5 text-start font-medium">مصرف</th>
                  <th className="px-3 py-2.5 text-start font-medium">فروش / تخفیف</th>
                  <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2.5 text-end font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((code) => {
                  const state = STATE_LABEL[code.state];
                  const usage = code.usageLimit ? Math.min(1, code.usedCount / code.usageLimit) : null;
                  return (
                    <tr key={code._id} className="border-t border-border/50 align-top hover:bg-surface-secondary/30">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-lg border border-dashed border-accent/50 bg-accent/5 px-2 py-0.5 font-mono text-[13px] font-bold tracking-wider text-accent" dir="ltr">
                            {code.code}
                          </span>
                          <Button isIconOnly size="sm" variant="ghost" aria-label="کپی کد" onPress={() => void copy(code.code)}>
                            <Copy size={14} />
                          </Button>
                        </div>
                        <p className="mt-1 text-xs font-medium">{code.title}</p>
                        <p className="text-[11px] text-muted">{code.campaign || NO_CAMPAIGN}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-semibold">{describeValue(code)}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{code.planIds.length ? code.planIds.map((plan) => plan.name).join("، ") : "همهٔ پلن‌های پولی"}</p>
                        {code.firstPurchaseOnly ? <Pill tone="info" className="mt-1">فقط اولین خرید</Pill> : null}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <p>{code.startsAt ? formatDateFa(code.startsAt) : "از همین حالا"}</p>
                        <p className="text-muted">تا {code.endsAt ? formatDateFa(code.endsAt) : "بدون پایان"}</p>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <p className="tabular-nums">
                          {formatNumberFa(code.usedCount)} {code.usageLimit ? `از ${formatNumberFa(code.usageLimit)}` : "· بدون سقف"}
                        </p>
                        {usage !== null ? (
                          <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-surface-secondary">
                            <div className={`h-full rounded-full ${usage >= 1 ? "bg-warning" : "bg-accent"}`} style={{ width: `${usage * 100}%` }} />
                          </div>
                        ) : null}
                        <p className="mt-1 text-muted">{code.perUserLimit ? `هر کاربر ${formatNumberFa(code.perUserLimit)} بار` : "بدون محدودیت کاربر"}</p>
                        {code.stats.reserved ? <p className="text-muted">{formatNumberFa(code.stats.reserved)} در حال پرداخت</p> : null}
                      </td>
                      <td className="px-3 py-3 text-xs tabular-nums">
                        <p className="font-semibold">{formatTomanFa(code.stats.revenueToman)}</p>
                        <p className="text-muted">−{formatTomanFa(code.stats.discountToman)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-start gap-2">
                          <Pill tone={state.tone}>{state.label}</Pill>
                          <Switch aria-label={code.active ? "غیرفعال کردن" : "فعال کردن"} size="sm" isSelected={code.active} isDisabled={busyId === code._id} onChange={(selected) => void toggle(code, selected)}>
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <Button isIconOnly size="sm" variant="ghost" aria-label="سوابق استفاده" onPress={() => setViewing(code)}>
                            <Eye size={16} />
                          </Button>
                          <Button isIconOnly size="sm" variant="ghost" aria-label="ویرایش" onPress={() => setEditing({ open: true, code })}>
                            <Edit2 size={16} />
                          </Button>
                          {code.usedCount === 0 ? (
                            <Button isIconOnly size="sm" variant="ghost" aria-label="حذف" onPress={() => setDeleting(code)}>
                              <Trash size={16} className="text-danger" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <DiscountEditorDialog
        open={editing.open}
        code={editing.code}
        plans={plans}
        campaigns={campaignNames}
        onOpenChange={(open) => setEditing((current) => ({ ...current, open }))}
        onSaved={load}
      />
      <RedemptionsDialog code={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف کد تخفیف"
        description={deleting ? `کد «${deleting.code}» برای همیشه حذف می‌شود. این کد هنوز استفاده نشده است.` : null}
        confirmLabel="حذف"
        isPending={Boolean(deleting && busyId === deleting._id)}
        onConfirm={async () => {
          if (!deleting) return;
          setBusyId(deleting._id);
          try {
            await subscriptionApi.deleteAdminDiscount(deleting._id);
            showToast("کد حذف شد", "success");
            setDeleting(null);
            await load();
          } catch (error) {
            showErrorToast(error);
          } finally {
            setBusyId(null);
          }
        }}
      />
    </div>
  );
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86_400_000);
}

const sparkLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" });

function RedemptionSpark({ daily }: { daily: AdminDiscountList["daily"] }) {
  const data = useMemo(() => {
    const byDay = new Map(daily.map((row) => [row._id, row]));
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" });
    return Array.from({ length: 30 }, (_, index) => {
      const date = daysAgo(29 - index);
      const key = formatter.format(date);
      const row = byDay.get(key);
      return { label: sparkLabel.format(date), count: row?.count ?? 0, discount: row?.discountToman ?? 0 };
    });
  }, [daily]);
  const total = data.reduce((sum, item) => sum + item.count, 0);
  return (
    <div>
      <p className="text-2xl font-extrabold tabular-nums">{formatNumberFa(total)}</p>
      <p className="text-xs text-muted">استفاده در ۳۰ روز اخیر</p>
      <div className="mt-3 h-36" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" hide />
            <Tooltip
              cursor={{ fill: "var(--surface-secondary)", opacity: 0.5 }}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface)", direction: "rtl", fontSize: 12 }}
              formatter={(value, _name, item) => [`${formatNumberFa(Number(value))} استفاده · ${formatTomanFa((item?.payload as { discount: number })?.discount ?? 0)} تخفیف`, ""]}
            />
            <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type EditorForm = {
  code: string;
  title: string;
  campaign: string;
  description: string;
  type: DiscountType;
  value: string;
  maxDiscount: string;
  planIds: string[];
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: string;
  perUserLimit: string;
  firstPurchaseOnly: boolean;
  active: boolean;
};

function toForm(code: AdminDiscountCode | null): EditorForm {
  if (!code) {
    return { code: "", title: "", campaign: "", description: "", type: "percent", value: "20", maxDiscount: "", planIds: [], startsAt: null, endsAt: null, usageLimit: "", perUserLimit: "1", firstPurchaseOnly: false, active: true };
  }
  return {
    code: code.code,
    title: code.title,
    campaign: code.campaign,
    description: code.description,
    type: code.type,
    value: String(code.value),
    maxDiscount: code.maxDiscount != null ? String(code.maxDiscount) : "",
    planIds: code.planIds.map((plan) => plan._id),
    startsAt: code.startsAt,
    endsAt: code.endsAt,
    usageLimit: code.usageLimit != null ? String(code.usageLimit) : "",
    perUserLimit: code.perUserLimit != null ? String(code.perUserLimit) : "",
    firstPurchaseOnly: code.firstPurchaseOnly,
    active: code.active,
  };
}

const digits = (value: string) => value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d]/g, "");

function DiscountEditorDialog({
  open,
  code,
  plans,
  campaigns,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  code: AdminDiscountCode | null;
  plans: SubscriptionPlan[];
  campaigns: string[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<EditorForm>(() => toForm(null));
  const [saving, setSaving] = useState(false);
  const paidPlans = useMemo(() => plans.filter((plan) => plan.active && plan.price > 0), [plans]);

  useEffect(() => {
    if (open) setForm(toForm(code));
  }, [open, code]);

  const update = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const value = Number(form.value) || 0;
  const maxDiscount = form.maxDiscount ? Number(form.maxDiscount) : null;
  const previewPlans = form.planIds.length ? paidPlans.filter((plan) => form.planIds.includes(plan._id)) : paidPlans;

  async function save() {
    if (!form.code.trim() || !form.title.trim()) {
      showToast("کد و عنوان را وارد کنید", "warning");
      return;
    }
    if (!(value > 0) || (form.type === "percent" && value > 100)) {
      showToast(form.type === "percent" ? "درصد تخفیف باید بین ۱ تا ۱۰۰ باشد" : "مبلغ تخفیف را وارد کنید", "warning");
      return;
    }
    const payload: DiscountCodePayload = {
      code: form.code.trim(),
      title: form.title.trim(),
      campaign: form.campaign.trim(),
      description: form.description.trim(),
      type: form.type,
      value,
      maxDiscount: form.type === "percent" ? maxDiscount : null,
      planIds: form.planIds,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
      firstPurchaseOnly: form.firstPurchaseOnly,
      active: form.active,
    };
    setSaving(true);
    try {
      if (code) await subscriptionApi.updateAdminDiscount(code._id, payload);
      else await subscriptionApi.createAdminDiscount(payload);
      showToast("کد تخفیف ذخیره شد", "success");
      onOpenChange(false);
      await onSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={code ? `ویرایش کد «${code.code}»` : "کد تخفیف جدید"} wide isPending={saving} onSubmit={() => void save()} submitLabel="ذخیرهٔ کد">
      <FormSection title="کد و کمپین" description="کد به حروف بزرگ/کوچک حساس نیست و فاصله‌ها نادیده گرفته می‌شوند.">
        <FormGrid>
          <FormField label="کد تخفیف" required hint="حروف انگلیسی، عدد، - و _ (۳ تا ۳۲ کاراکتر)">
            <div className="flex gap-2">
              <Input variant="secondary" className="w-full font-mono uppercase" dir="ltr" value={form.code} onChange={(event) => update("code", event.target.value.toUpperCase())} />
              <Button size="sm" variant="secondary" className="h-10 shrink-0" onPress={() => update("code", randomDiscountCode(form.campaign.match(/[A-Za-z0-9]+/)?.[0] ?? ""))}>
                <MagicStar size={15} />
                تولید
              </Button>
            </div>
          </FormField>
          <FormField label="عنوان" required hint="برای شناسایی داخلی؛ مثلاً «تخفیف خوش‌آمد».">
            <Input variant="secondary" className="w-full" value={form.title} onChange={(event) => update("title", event.target.value)} />
          </FormField>
        </FormGrid>
        <FormGrid>
          <FormField label="کمپین" hint="کدهای هم‌کمپین با هم گزارش می‌شوند.">
            <Input variant="secondary" className="w-full" list="discount-campaigns" value={form.campaign} placeholder="مثلاً نوروز ۱۴۰۵" onChange={(event) => update("campaign", event.target.value)} />
            <datalist id="discount-campaigns">
              {campaigns.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </FormField>
          <FormField label="توضیح داخلی (اختیاری)">
            <Input variant="secondary" className="w-full" value={form.description} onChange={(event) => update("description", event.target.value)} />
          </FormField>
        </FormGrid>
      </FormSection>

      <FormSection title="مقدار تخفیف">
        <div className="flex gap-2">
          {(["percent", "fixed"] as const).map((type) => (
            <Button key={type} size="sm" variant={form.type === type ? "primary" : "secondary"} onPress={() => update("type", type)}>
              {type === "percent" ? "درصدی" : "مبلغ ثابت (تومان)"}
            </Button>
          ))}
        </div>
        <FormGrid>
          <FormField label={form.type === "percent" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"} required>
            <Input variant="secondary" className="w-full" dir="ltr" inputMode="numeric" value={form.value} onChange={(event) => update("value", digits(event.target.value))} />
          </FormField>
          {form.type === "percent" ? (
            <FormField label="سقف تخفیف (تومان، اختیاری)" hint="خالی = بدون سقف">
              <Input variant="secondary" className="w-full" dir="ltr" inputMode="numeric" value={form.maxDiscount} onChange={(event) => update("maxDiscount", digits(event.target.value))} />
            </FormField>
          ) : null}
        </FormGrid>
        <div>
          <p className="mb-2 text-sm font-medium">پلن‌های مشمول</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={form.planIds.length === 0 ? "primary" : "secondary"} onPress={() => update("planIds", [])}>
              همهٔ پلن‌های پولی
            </Button>
            {paidPlans.map((plan) => {
              const selected = form.planIds.includes(plan._id);
              return (
                <Button key={plan._id} size="sm" variant={selected ? "primary" : "secondary"} onPress={() => update("planIds", selected ? form.planIds.filter((id) => id !== plan._id) : [...form.planIds, plan._id])}>
                  {plan.name}
                </Button>
              );
            })}
          </div>
        </div>
        {previewPlans.length && value > 0 ? (
          <div className="rounded-xl border border-border/60 bg-surface-secondary/40 p-3">
            <p className="mb-2 text-xs font-semibold text-muted">پیش‌نمایش قیمت (محاسبهٔ نهایی روی سرور)</p>
            <ul className="space-y-1.5 text-sm">
              {previewPlans.map((plan) => {
                const result = previewPrice(plan, form.type, value, maxDiscount);
                return (
                  <li key={plan._id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{plan.name}</span>
                    <span className="tabular-nums">
                      <span className="text-muted line-through">{formatPlanAmountFa(plan.price, plan.priceUnit)}</span>
                      <span className="ms-2 font-bold text-success-foreground">{formatPlanAmountFa(result.final, plan.priceUnit)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </FormSection>

      <FormSection title="محدودیت‌ها و زمان‌بندی">
        <FormGrid>
          <FormField label="شروع اعتبار" hint="خالی = از همین حالا">
            <JalaliDateField value={form.startsAt} onChange={(next) => update("startsAt", next)} edge="start" />
          </FormField>
          <FormField label="پایان اعتبار" hint="خالی = بدون پایان">
            <JalaliDateField value={form.endsAt} onChange={(next) => update("endsAt", next)} edge="end" />
          </FormField>
        </FormGrid>
        <FormGrid>
          <FormField label="سقف کل استفاده" hint="خالی = نامحدود">
            <Input variant="secondary" className="w-full" dir="ltr" inputMode="numeric" value={form.usageLimit} onChange={(event) => update("usageLimit", digits(event.target.value))} />
          </FormField>
          <FormField label="سقف استفادهٔ هر کاربر" hint="خالی = نامحدود">
            <Input variant="secondary" className="w-full" dir="ltr" inputMode="numeric" value={form.perUserLimit} onChange={(event) => update("perUserLimit", digits(event.target.value))} />
          </FormField>
        </FormGrid>
        <SwitchRow label="فقط برای اولین خرید" description="کاربرانی که قبلاً پلن پولی داشته‌اند نمی‌توانند از این کد استفاده کنند." selected={form.firstPurchaseOnly} onChange={(selected) => update("firstPurchaseOnly", selected)} />
        <SwitchRow label="فعال" description="کد غیرفعال در صفحهٔ خرید پذیرفته نمی‌شود." selected={form.active} onChange={(selected) => update("active", selected)} />
      </FormSection>
      {code && code.usedCount > 0 ? <p className="text-xs text-muted">تغییر مقدار تخفیف روی خریدهای قبلی اثری ندارد.</p> : null}
    </FormDialog>
  );
}

function RedemptionsDialog({ code, onClose }: { code: AdminDiscountCode | null; onClose: () => void }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof subscriptionApi.fetchAdminDiscountRedemptions>> | null>(null);

  useEffect(() => {
    setPage(1);
    setData(null);
  }, [code]);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    subscriptionApi
      .fetchAdminDiscountRedemptions(code._id, page)
      .then((result) => !cancelled && setData(result))
      .catch((error) => showErrorToast(error));
    return () => {
      cancelled = true;
    };
  }, [code, page]);

  return (
    <FormDialog open={Boolean(code)} onOpenChange={(open) => !open && onClose()} title={code ? `سوابق استفاده از «${code.code}»` : ""} wide submitLabel="بستن" onSubmit={onClose}>
      {!data ? (
        <SkeletonRows rows={3} />
      ) : data.items.length === 0 ? (
        <EmptyState title="این کد هنوز استفاده نشده است" />
      ) : (
        <>
          <ul className="divide-y divide-border/50">
            {data.items.map((row: DiscountRedemptionRow) => (
              <li key={row._id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {`${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim() || "—"} <span className="text-xs font-normal text-muted" dir="ltr">{row.user?.mobile}</span>
                  </p>
                  <p className="text-xs text-muted">
                    {row.plan?.name ?? "—"} · {row.flow === "bale" ? "بله" : "درخواست دستی"} · {formatDateTimeFa(row.redeemedAt ?? row.createdAt)}
                  </p>
                </div>
                <div className="text-end text-xs tabular-nums">
                  <p className="font-semibold">{formatPlanAmountFa(row.amountAfter, row.priceUnit)}</p>
                  <p className="text-muted">
                    <span className="line-through">{formatPlanAmountFa(row.amountBefore, row.priceUnit)}</span>
                  </p>
                  <Pill tone={row.status === "redeemed" ? "success" : "warning"}>{row.status === "redeemed" ? "پرداخت‌شده" : "در حال پرداخت"}</Pill>
                </div>
              </li>
            ))}
          </ul>
          <PaginationBar pagination={data.pagination} onPage={setPage} />
        </>
      )}
    </FormDialog>
  );
}
