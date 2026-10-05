"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@heroui/react";
import { Crown, TickCircle } from "iconsax-reactjs";

import * as insightsApi from "@/common/api/admin-insights";
import * as subscriptionApi from "@/common/api/subscriptions";
import type { AdminSubscriptionHistory } from "@/common/interfaces/admin";
import type { SubscriptionPlan, UserSubscription } from "@/common/interfaces/subscription.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AdminPanel, ConfirmDialog, EmptyState, Field, KeyValue, NativeSelect, Pill, SkeletonRows } from "../ui/AdminUi";
import { formatDateFa, formatDateTimeFa, formatNumberFa } from "../ui/admin-format";
import { SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE } from "../subscription-labels";

export function UserSubscriptionTab({ userId, onChanged }: { userId: string; onChanged: () => Promise<void> | void }) {
  const [data, setData] = useState<AdminSubscriptionHistory | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [planId, setPlanId] = useState("");
  const [days, setDays] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<UserSubscription | null>(null);

  const load = useCallback(async () => {
    try {
      const [history, nextPlans] = await Promise.all([
        insightsApi.fetchUserSubscriptionHistory(userId),
        subscriptionApi.fetchAdminSubscriptionPlans(),
      ]);
      setData(history);
      const active = nextPlans.filter((plan) => plan.active);
      setPlans(active);
      setPlanId((current) => current || active.find((plan) => plan.slug !== "free")?._id || active[0]?._id || "");
    } catch (error) {
      showErrorToast(error, "دریافت اشتراک ناموفق بود");
    }
  }, [userId]);

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

  function assign() {
    const durationDays = Number(days);
    const expiresAt =
      days.trim() && Number.isFinite(durationDays) && durationDays > 0
        ? new Date(Date.now() + durationDays * 86_400_000).toISOString()
        : undefined;
    void run(
      () => subscriptionApi.assignAdminSubscription({ userId, planId, expiresAt, note: note.trim() || undefined }),
      "اشتراک فعال شد و به کاربر اطلاع داده شد",
    );
  }

  if (!data) return <SkeletonRows rows={4} height="h-24" />;

  const current = data.current.subscription;
  const pending = data.current.pendingRequest;
  const isPaid = current?.planSnapshot?.slug && current.planSnapshot.slug !== "free";

  return (
    <div className="space-y-5">
      {pending ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4">
          <div>
            <p className="font-semibold">درخواست اشتراک «{pending.plan?.name ?? pending.planSnapshot?.name}»</p>
            <p className="mt-1 text-xs text-muted">
              {formatDateTimeFa(pending.createdAt)}
              {pending.requestNote ? ` · «${pending.requestNote}»` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => void run(() => subscriptionApi.rejectSubscriptionRequest(pending._id), "درخواست رد شد")}>
              رد درخواست
            </Button>
            <Button size="sm" isPending={busy} onPress={() => void run(() => subscriptionApi.approveSubscriptionRequest(pending._id), "اشتراک فعال شد")}>
              <TickCircle size={16} />
              تأیید و فعال‌سازی
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel title="اشتراک فعلی">
          {!current ? (
            <EmptyState title="اشتراک فعالی ندارد" />
          ) : (
            <div>
              <div className="mb-3 flex items-center gap-3">
                <span className={`flex size-11 items-center justify-center rounded-2xl ${isPaid ? "bg-warning/15 text-warning-foreground" : "bg-surface-secondary text-muted"}`}>
                  <Crown size={22} variant="Bold" />
                </span>
                <div>
                  <p className="text-lg font-bold">{current.plan?.name ?? current.planSnapshot?.name}</p>
                  <p className="text-xs text-muted">
                    {data.current.daysRemaining == null ? "بدون تاریخ انقضا" : `${formatNumberFa(data.current.daysRemaining)} روز باقی‌مانده`}
                  </p>
                </div>
              </div>
              <KeyValue label="شروع">{formatDateFa(current.startsAt)}</KeyValue>
              <KeyValue label="انقضا">{current.expiresAt ? formatDateFa(current.expiresAt) : "نامحدود"}</KeyValue>
              {current.note ? <KeyValue label="یادداشت">{current.note}</KeyValue> : null}
              {data.current.upcoming ? (
                <KeyValue label="زمان‌بندی‌شده">
                  {data.current.upcoming.plan?.name} از {formatDateFa(data.current.upcoming.startsAt)}
                </KeyValue>
              ) : null}
              {isPaid ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {[30, 90, 365].map((extend) => (
                    <Button key={extend} size="sm" variant="secondary" isDisabled={busy} onPress={() => void run(() => subscriptionApi.updateAdminSubscription(current._id, { extendDays: extend }), "اشتراک تمدید شد")}>
                      +{formatNumberFa(extend)} روز
                    </Button>
                  ))}
                  <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => setRevoking(current)}>
                    لغو اشتراک
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="فعال‌سازی یا تغییر پلن" description="پلن قبلی لغو و پلن جدید از همین لحظه فعال می‌شود؛ کاربر در تلگرام باخبر می‌شود.">
          <div className="space-y-4">
            <Field label="پلن">
              <NativeSelect ariaLabel="پلن" value={planId} onChange={setPlanId} options={plans.map((plan) => ({ value: plan._id, label: plan.name }))} />
            </Field>
            <Field label="مدت (روز) — اختیاری" hint="خالی بماند تا مدت پیش‌فرض پلن (ماهانه ۳۰، سالانه ۳۶۵) استفاده شود.">
              <Input variant="secondary" dir="ltr" inputMode="numeric" value={days} onChange={(event) => setDays(event.target.value)} />
            </Field>
            <Field label="یادداشت (اختیاری)">
              <Input variant="secondary" value={note} placeholder="مثلاً: پرداخت کارت به کارت ۱۲ مهر" onChange={(event) => setNote(event.target.value)} />
            </Field>
            <Button className="w-full" isPending={busy} isDisabled={!planId} onPress={assign}>
              فعال‌سازی پلن
            </Button>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="تاریخچه اشتراک‌ها">
        {data.history.length === 0 ? (
          <EmptyState title="تاریخچه‌ای ندارد" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-secondary/60 text-xs text-muted">
                <tr>
                  <th className="px-3 py-2.5 text-start font-medium">پلن</th>
                  <th className="px-3 py-2.5 text-start font-medium">وضعیت</th>
                  <th className="px-3 py-2.5 text-start font-medium">شروع</th>
                  <th className="px-3 py-2.5 text-start font-medium">انقضا</th>
                  <th className="px-3 py-2.5 text-start font-medium">توسط</th>
                  <th className="px-3 py-2.5 text-start font-medium">یادداشت</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((item) => {
                  const by = typeof item.assignedBy === "object" && item.assignedBy ? `${item.assignedBy.firstName} ${item.assignedBy.lastName}` : item.requestedByUser ? "درخواست کاربر" : "خودکار";
                  return (
                    <tr key={item._id} className="border-t border-border/50">
                      <td className="px-3 py-2.5 font-medium">{item.plan?.name ?? item.planSnapshot?.name}</td>
                      <td className="px-3 py-2.5">
                        <Pill tone={SUBSCRIPTION_STATUS_TONE[item.status]}>{SUBSCRIPTION_STATUS_LABEL[item.status]}</Pill>
                      </td>
                      <td className="px-3 py-2.5 text-xs">{formatDateFa(item.startsAt)}</td>
                      <td className="px-3 py-2.5 text-xs">{item.expiresAt ? formatDateFa(item.expiresAt) : "نامحدود"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted">{by}</td>
                      <td className="max-w-[14rem] truncate px-3 py-2.5 text-xs text-muted">{item.note || item.requestNote || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(null)}
        title="لغو اشتراک"
        description="اشتراک همین حالا لغو می‌شود و کاربر به پلن رایگان برمی‌گردد."
        confirmLabel="لغو اشتراک"
        isPending={busy}
        onConfirm={() => revoking && void run(() => subscriptionApi.revokeAdminSubscription(revoking._id), "اشتراک لغو شد")}
      />
    </div>
  );
}
