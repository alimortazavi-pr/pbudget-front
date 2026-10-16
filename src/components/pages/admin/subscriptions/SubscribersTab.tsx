"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button, Input, Switch, TextArea } from "@heroui/react";
import { CloseCircle, DocumentDownload, Eye, Note1, Repeat, TimerStart } from "iconsax-reactjs";

import * as subscriptionApi from "@/common/api/subscriptions";
import type { AdminSubscriptionListParams, AdminSubscriptionSource, AdminSubscriptionStatusFilter } from "@/common/api/subscriptions";
import { PATHS } from "@/common/constants";
import type { SubscriptionPlan, UserSubscription } from "@/common/interfaces/subscription.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AdminPanel, ConfirmDialog, EmptyState, Field, FormDialog, KeyValue, NativeSelect, PaginationBar, Pill, SearchField, SegmentedTabs, SkeletonRows, UserAvatar } from "../ui/AdminUi";
import { formatDateFa, formatDateTimeFa, formatNumberFa, formatRelativeFa } from "../ui/admin-format";
import { SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE } from "../subscription-labels";
import { JalaliDateField } from "./JalaliDateField";
import { SOURCE_LABEL, formatPlanAmountFa, formatTomanFa, userNameOf } from "./subscription-format";

type ListResponse = Awaited<ReturnType<typeof subscriptionApi.fetchAdminSubscriptionsFiltered>>;
export type SubscriberUser = { _id: string; firstName: string; lastName: string; mobile: string };

const STATUS_FILTERS: { value: AdminSubscriptionStatusFilter; label: string }[] = [
  { value: "current", label: "در حال حاضر فعال" },
  { value: "expiring", label: "انقضا تا ۷ روز آینده" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
  { value: "expired", label: "منقضی‌شده" },
  { value: "canceled", label: "لغوشده" },
  { value: "superseded", label: "جایگزین‌شده" },
  { value: "", label: "همه وضعیت‌ها" },
];

const SOURCE_FILTERS: { value: AdminSubscriptionSource; label: string }[] = [
  { value: "", label: "همه کانال‌ها" },
  { value: "bale", label: SOURCE_LABEL.bale },
  { value: "bazaar", label: SOURCE_LABEL.bazaar },
  { value: "manual", label: SOURCE_LABEL.manual },
  { value: "trial", label: SOURCE_LABEL.trial },
];

const SORTS = [
  { value: "createdAt", label: "جدیدترین" },
  { value: "expiresAt", label: "نزدیک‌ترین انقضا" },
  { value: "amount", label: "بیشترین مبلغ" },
];

/** Milliseconds from now until `date` (negative when it is in the past). */
function msFromNow(date: string | Date) {
  return new Date(date).getTime() - Date.now();
}

/** Same rule as the server: extend from the later of now and the current expiry. */
function extendedExpiry(expiresAt: string | null | undefined, days: number) {
  const base = Math.max(Date.now(), expiresAt ? new Date(expiresAt).getTime() : 0);
  return new Date(base + days * 86_400_000);
}

const SOURCE_TONE: Record<string, "accent" | "success" | "info" | "warning" | "neutral"> = { bale: "accent", bazaar: "success", manual: "info", trial: "warning" };

export function SubscribersTab({
  plans,
  onChanged,
  onAssign,
  initialStatus = "current",
}: {
  plans: SubscriptionPlan[];
  onChanged: () => Promise<void>;
  onAssign: (user: SubscriberUser) => void;
  initialStatus?: AdminSubscriptionStatusFilter;
}) {
  const [filters, setFilters] = useState<AdminSubscriptionListParams>({ status: initialStatus, planId: "", source: "", search: "", paid: true, discounted: false, sort: "createdAt" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<UserSubscription | null>(null);
  const [extending, setExtending] = useState<UserSubscription | null>(null);
  const [noting, setNoting] = useState<UserSubscription | null>(null);
  const [viewing, setViewing] = useState<UserSubscription | null>(null);

  useEffect(() => {
    setFilters((current) => ({ ...current, status: initialStatus }));
    setPage(1);
  }, [initialStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await subscriptionApi.fetchAdminSubscriptionsFiltered({ ...filters, page, limit: 20 }));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (next: Partial<AdminSubscriptionListParams>) => {
    setFilters((current) => ({ ...current, ...next }));
    setPage(1);
  };

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      showToast(message, "success");
      setRevoking(null);
      setExtending(null);
      setNoting(null);
      await Promise.all([load(), onChanged()]);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      await subscriptionApi.downloadAdminSubscriptionsCsv(filters);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminPanel
      title="مشترکین"
      description="جستجو، فیلتر و مدیریت اشتراک هر کاربر. خروجی CSV دقیقاً همین فیلتر را دارد."
      actions={
        <Button size="sm" variant="secondary" isPending={exporting} onPress={() => void exportCsv()}>
          <DocumentDownload size={16} />
          خروجی CSV
        </Button>
      }
      bodyClassName="p-4 sm:p-5 space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))]">
        <SearchField value={filters.search ?? ""} placeholder="نام یا موبایل کاربر…" onChange={(value) => patch({ search: value })} />
        <NativeSelect ariaLabel="وضعیت" value={filters.status ?? ""} onChange={(value) => patch({ status: value as AdminSubscriptionStatusFilter })} options={STATUS_FILTERS} />
        <NativeSelect ariaLabel="پلن" value={filters.planId ?? ""} onChange={(value) => patch({ planId: value })} options={[{ value: "", label: "همه پلن‌ها" }, ...plans.map((plan) => ({ value: plan._id, label: plan.name }))]} />
        <NativeSelect ariaLabel="کانال خرید" value={filters.source ?? ""} onChange={(value) => patch({ source: value as AdminSubscriptionSource })} options={SOURCE_FILTERS} />
        <NativeSelect ariaLabel="مرتب‌سازی" value={filters.sort ?? "createdAt"} onChange={(value) => patch({ sort: value as AdminSubscriptionListParams["sort"] })} options={SORTS} />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <Switch size="sm" isSelected={Boolean(filters.paid)} onChange={(selected) => patch({ paid: selected })}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <span className="ms-2">فقط اشتراک‌های پولی (بدون پلن رایگان و آزمایشی)</span>
        </Switch>
        <Switch size="sm" isSelected={Boolean(filters.discounted)} onChange={(selected) => patch({ discounted: selected })}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <span className="ms-2">فقط خرید با کد تخفیف</span>
        </Switch>
        {data ? <span className="ms-auto text-xs text-muted">{formatNumberFa(data.pagination.total)} نتیجه</span> : null}
      </div>

      {loading && !data ? (
        <SkeletonRows rows={6} />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="اشتراکی با این فیلتر پیدا نشد" description="فیلترها را تغییر دهید یا «فقط اشتراک‌های پولی» را خاموش کنید." />
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-surface-secondary/60 text-xs text-muted">
                <tr>
                  <th className="px-3 py-2.5 text-start font-medium">کاربر</th>
                  <th className="px-3 py-2.5 text-start font-medium">پلن</th>
                  <th className="px-3 py-2.5 text-start font-medium">کانال</th>
                  <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2.5 text-start font-medium">مبلغ</th>
                  <th className="px-3 py-2.5 text-start font-medium">شروع</th>
                  <th className="px-3 py-2.5 text-start font-medium">انقضا</th>
                  <th className="px-3 py-2.5 text-end font-medium">اقدامات</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const slug = item.plan?.slug ?? item.planSnapshot?.slug;
                  const isFree = slug === "free";
                  const live = item.status === "active";
                  const scheduled = live && msFromNow(item.startsAt) > 0;
                  const soon = live && item.expiresAt && msFromNow(item.expiresAt) < 7 * 86_400_000;
                  const unit = item.planSnapshot?.priceUnit ?? item.plan?.priceUnit;
                  return (
                    <tr key={item._id} className="border-t border-border/50 hover:bg-surface-secondary/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={userNameOf(item)} size={32} />
                          <div className="min-w-0">
                            {item.user?._id ? (
                              <Link href={`${PATHS.ADMIN_USER(item.user._id)}?tab=subscription`} className="font-semibold hover:text-accent">
                                {userNameOf(item)}
                              </Link>
                            ) : (
                              userNameOf(item)
                            )}
                            <p className="text-xs text-muted" dir="ltr">{item.user?.mobile}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{item.plan?.name ?? item.planSnapshot?.name}</p>
                        {item.discount ? <Pill tone="accent" className="mt-1">کد {item.discount.code}</Pill> : null}
                      </td>
                      <td className="px-3 py-2.5">
                        <Pill tone={SOURCE_TONE[item.source ?? "manual"] ?? "neutral"}>{SOURCE_LABEL[item.source ?? "manual"]}</Pill>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <Pill tone={scheduled ? "info" : SUBSCRIPTION_STATUS_TONE[item.status]}>{scheduled ? "زمان‌بندی‌شده" : SUBSCRIPTION_STATUS_LABEL[item.status]}</Pill>
                          {item.refundedToman ? <Pill tone="danger">بازپرداخت</Pill> : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs tabular-nums">
                        {item.amountPaid ? (
                          <>
                            {formatPlanAmountFa(item.amountPaid, unit)}
                            {item.discount ? <span className="block text-muted line-through">{formatPlanAmountFa(item.discount.amountBefore, unit)}</span> : null}
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs">{formatDateFa(item.startsAt)}</td>
                      <td className="px-3 py-2.5 text-xs">
                        {item.expiresAt ? (
                          <>
                            <span className={soon ? "font-semibold text-warning-foreground" : ""}>{formatDateFa(item.expiresAt)}</span>
                            {live ? <span className="block text-muted">{formatRelativeFa(item.expiresAt)}</span> : null}
                          </>
                        ) : (
                          "نامحدود"
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          <Button isIconOnly size="sm" variant="ghost" aria-label="جزئیات" onPress={() => setViewing(item)}>
                            <Eye size={16} />
                          </Button>
                          <Button isIconOnly size="sm" variant="ghost" aria-label="یادداشت یا بازپرداخت" onPress={() => setNoting(item)}>
                            <Note1 size={16} />
                          </Button>
                          {item.user?._id ? (
                            <Button isIconOnly size="sm" variant="ghost" aria-label="فعال‌سازی یا تغییر پلن" onPress={() => item.user && onAssign(item.user)}>
                              <Repeat size={16} />
                            </Button>
                          ) : null}
                          {!isFree && (live || item.status === "expired") ? (
                            <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => setExtending(item)}>
                              <TimerStart size={15} />
                              تمدید
                            </Button>
                          ) : null}
                          {live && !isFree ? (
                            <Button isIconOnly size="sm" variant="ghost" aria-label="لغو اشتراک" isDisabled={busy} onPress={() => setRevoking(item)}>
                              <CloseCircle size={16} className="text-danger" />
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
          <PaginationBar pagination={data.pagination} onPage={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="لغو اشتراک"
        description={revoking ? `اشتراک «${revoking.plan?.name ?? revoking.planSnapshot?.name}» برای ${userNameOf(revoking)} همین حالا لغو و کاربر به پلن رایگان منتقل می‌شود. برای ثبت بازپرداخت از «یادداشت/بازپرداخت» استفاده کنید.` : null}
        confirmLabel="لغو اشتراک"
        isPending={busy}
        onConfirm={() => revoking && void run(() => subscriptionApi.revokeAdminSubscription(revoking._id), "اشتراک لغو شد")}
      />
      <ExtendDialog subscription={extending} busy={busy} onClose={() => setExtending(null)} onSubmit={(payload) => extending && void run(() => subscriptionApi.updateAdminSubscription(extending._id, payload), "اشتراک تمدید شد")} />
      <NoteDialog subscription={noting} busy={busy} onClose={() => setNoting(null)} onSubmit={(payload) => noting && void run(() => subscriptionApi.addAdminSubscriptionNote(noting._id, payload), payload.kind === "refund" ? "بازپرداخت ثبت شد" : "یادداشت ثبت شد")} />
      <DetailsDialog subscription={viewing} onClose={() => setViewing(null)} />
    </AdminPanel>
  );
}

function ExtendDialog({ subscription, busy, onClose, onSubmit }: { subscription: UserSubscription | null; busy: boolean; onClose: () => void; onSubmit: (payload: { extendDays?: number; expiresAt?: string | null; note?: string }) => void }) {
  const [mode, setMode] = useState<"days" | "date">("days");
  const [days, setDays] = useState("30");
  const [date, setDate] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!subscription) return;
    setMode("days");
    setDays("30");
    setDate(subscription.expiresAt ?? null);
    setNote(subscription.note ?? "");
  }, [subscription]);

  const preview = extendedExpiry(subscription?.expiresAt, Number(days) || 0);

  return (
    <FormDialog
      open={Boolean(subscription)}
      onOpenChange={(open) => !open && onClose()}
      title="تمدید اشتراک"
      description={subscription ? `${userNameOf(subscription)} · ${subscription.plan?.name ?? subscription.planSnapshot?.name}` : undefined}
      submitLabel="ثبت تمدید"
      isPending={busy}
      submitDisabled={mode === "days" ? !(Number(days) > 0) : false}
      onSubmit={() => onSubmit(mode === "days" ? { extendDays: Number(days), note } : { expiresAt: date, note })}
    >
      <SegmentedTabs size="sm" value={mode} onChange={setMode} items={[{ id: "days", label: "افزودن روز" }, { id: "date", label: "تاریخ انقضای دقیق" }]} />
      {mode === "days" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90, 365].map((value) => (
              <Button key={value} size="sm" variant={Number(days) === value ? "primary" : "secondary"} onPress={() => setDays(String(value))}>
                +{formatNumberFa(value)} روز
              </Button>
            ))}
          </div>
          <Field label="تعداد روز" hint={`انقضای جدید: ${formatDateFa(preview)}`}>
            <Input variant="secondary" dir="ltr" inputMode="numeric" value={days} onChange={(event) => setDays(event.target.value.replace(/[^\d]/g, ""))} />
          </Field>
        </>
      ) : (
        <Field label="تاریخ انقضا" hint="خالی = بدون تاریخ انقضا (نامحدود)">
          <JalaliDateField value={date} onChange={setDate} edge="end" />
        </Field>
      )}
      <Field label="یادداشت اشتراک (اختیاری)">
        <Input variant="secondary" value={note} onChange={(event) => setNote(event.target.value)} />
      </Field>
    </FormDialog>
  );
}

function NoteDialog({ subscription, busy, onClose, onSubmit }: { subscription: UserSubscription | null; busy: boolean; onClose: () => void; onSubmit: (payload: { kind: "note" | "refund"; text?: string; amountToman?: number; revoke?: boolean }) => void }) {
  const [kind, setKind] = useState<"note" | "refund">("note");
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [revoke, setRevoke] = useState(false);

  useEffect(() => {
    if (!subscription) return;
    setKind("note");
    setText("");
    setAmount("");
    setRevoke(false);
  }, [subscription]);

  return (
    <FormDialog
      open={Boolean(subscription)}
      onOpenChange={(open) => !open && onClose()}
      title="یادداشت داخلی یا ثبت بازپرداخت"
      description="فقط ادمین‌ها این یادداشت‌ها را می‌بینند. بازپرداخت در گزارش‌ها از درآمد کم می‌شود."
      submitLabel={kind === "refund" ? "ثبت بازپرداخت" : "ثبت یادداشت"}
      isPending={busy}
      submitDisabled={kind === "note" ? !text.trim() : !(Number(amount) > 0) && !text.trim()}
      onSubmit={() => onSubmit(kind === "refund" ? { kind, text, amountToman: Number(amount) || 0, revoke } : { kind, text })}
    >
      <SegmentedTabs size="sm" value={kind} onChange={setKind} items={[{ id: "note", label: "یادداشت" }, { id: "refund", label: "بازپرداخت" }]} />
      {kind === "refund" ? (
        <>
          <Field label="مبلغ بازپرداخت (تومان)" hint={subscription?.amountPaid ? `مبلغ پرداختی: ${formatPlanAmountFa(subscription.amountPaid, subscription.planSnapshot?.priceUnit)}` : undefined}>
            <Input variant="secondary" dir="ltr" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ""))} />
          </Field>
          {subscription?.status === "active" ? (
            <Switch size="sm" isSelected={revoke} onChange={setRevoke}>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <span className="ms-2 text-sm">اشتراک هم‌زمان لغو شود</span>
            </Switch>
          ) : null}
        </>
      ) : null}
      <Field label={kind === "refund" ? "توضیح (روش و شماره پیگیری)" : "متن یادداشت"}>
        <TextArea variant="secondary" rows={3} value={text} onChange={(event) => setText(event.target.value)} />
      </Field>
    </FormDialog>
  );
}

function DetailsDialog({ subscription, onClose }: { subscription: UserSubscription | null; onClose: () => void }) {
  const unit = subscription?.planSnapshot?.priceUnit;
  return (
    <FormDialog open={Boolean(subscription)} onOpenChange={(open) => !open && onClose()} title="جزئیات اشتراک" submitLabel="بستن" onSubmit={onClose}>
      {subscription ? (
        <div className="space-y-4">
          <div>
            <KeyValue label="کاربر">{userNameOf(subscription)}</KeyValue>
            <KeyValue label="پلن">{subscription.plan?.name ?? subscription.planSnapshot?.name}</KeyValue>
            <KeyValue label="کانال">{SOURCE_LABEL[subscription.source ?? "manual"]}</KeyValue>
            <KeyValue label="وضعیت">{SUBSCRIPTION_STATUS_LABEL[subscription.status]}</KeyValue>
            <KeyValue label="مبلغ پرداختی">{subscription.amountPaid ? formatPlanAmountFa(subscription.amountPaid, unit) : "—"}</KeyValue>
            {subscription.discount ? (
              <KeyValue label="کد تخفیف">
                {subscription.discount.code} · {formatPlanAmountFa(subscription.discount.discountAmount, unit)} تخفیف
              </KeyValue>
            ) : null}
            <KeyValue label="تاریخ خرید">{formatDateTimeFa(subscription.purchasedAt ?? subscription.createdAt)}</KeyValue>
            <KeyValue label="شروع / انقضا">
              {formatDateFa(subscription.startsAt)} ← {subscription.expiresAt ? formatDateFa(subscription.expiresAt) : "نامحدود"}
            </KeyValue>
            {subscription.refundedToman ? <KeyValue label="بازپرداخت‌شده">{formatTomanFa(subscription.refundedToman)}</KeyValue> : null}
            {subscription.note ? <KeyValue label="یادداشت">{subscription.note}</KeyValue> : null}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">یادداشت‌های داخلی</p>
            {subscription.adminNotes?.length ? (
              <ul className="space-y-2">
                {[...subscription.adminNotes].reverse().map((note) => (
                  <li key={note._id} className={`rounded-xl border p-3 text-sm ${note.kind === "refund" ? "border-danger/30 bg-danger/5" : "border-border/60"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span>
                        {note.kind === "refund" ? <Pill tone="danger">بازپرداخت {note.amountToman ? formatTomanFa(note.amountToman) : ""}</Pill> : <Pill>یادداشت</Pill>} {note.byName}
                      </span>
                      <span>{formatDateTimeFa(note.at)}</span>
                    </div>
                    {note.text ? <p className="mt-1.5 leading-6">{note.text}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">یادداشتی ثبت نشده است.</p>
            )}
          </div>
        </div>
      ) : null}
    </FormDialog>
  );
}
