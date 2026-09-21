"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { Add, Crown, Edit2, Flash, Refresh2, Trash } from "iconsax-reactjs";

import { useTranslation } from "@/components/providers/LanguageProvider";
import * as adminApi from "@/common/api/admin";
import * as subscriptionApi from "@/common/api/subscriptions";
import type { AdminUser } from "@/common/interfaces/admin";
import type { SubscriptionFeature, SubscriptionPlan, SubscriptionPeriod, UserSubscription } from "@/common/interfaces/subscription.interface";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

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

const emptyPlan: PlanForm = {
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

function toForm(plan?: SubscriptionPlan): PlanForm {
  if (!plan) return emptyPlan;
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

export function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextPlans, nextSubscriptions, userResult] = await Promise.all([
        subscriptionApi.fetchAdminSubscriptionPlans(),
        subscriptionApi.fetchAdminSubscriptions({ limit: 100 }),
        adminApi.fetchAdminUsers({ limit: 100 }),
      ]);
      setPlans(nextPlans);
      setSubscriptions(nextSubscriptions.items);
      setUsers(userResult.items);
    } catch {
      showToast(t("common.error"), "danger");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const activePlans = useMemo(() => plans.filter((plan) => plan.active), [plans]);
  const updateForm = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  async function savePlan() {
    if (!form.name.trim() || (!editingId && !form.slug.trim())) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        periodDays: form.period === "custom" ? Number(form.periodDays) || null : undefined,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editingId) await subscriptionApi.updateAdminSubscriptionPlan(editingId, payload);
      else await subscriptionApi.createAdminSubscriptionPlan(payload as never);
      showToast(t("admin.planSaved"), "success");
      setForm(emptyPlan);
      setEditingId(null);
      await load();
    } catch {
      showToast(t("common.saveFailed"), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function archivePlan(id: string) {
    if (!window.confirm(t("admin.archivePlanConfirm", { name: t("admin.plans") }))) return;
    try {
      await subscriptionApi.archiveAdminSubscriptionPlan(id);
      showToast(t("admin.planArchived"), "success");
      await load();
    } catch {
      showToast(t("common.error"), "danger");
    }
  }

  async function assign() {
    if (!selectedUser || !selectedPlan) return;
    try {
      await subscriptionApi.assignAdminSubscription({ userId: selectedUser, planId: selectedPlan });
      showToast(t("admin.subscriptionSaved"), "success");
      setSelectedUser("");
      setSelectedPlan("");
      await load();
    } catch {
      showToast(t("common.error"), "danger");
    }
  }

  async function revoke(id: string) {
    try {
      await subscriptionApi.revokeAdminSubscription(id);
      await load();
    } catch {
      showToast(t("common.error"), "danger");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crown size={24} className="text-accent" variant="Bold" />
            <h1 className="text-2xl font-bold">{t("admin.subscriptionsTitle")}</h1>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t("admin.subscriptionsDescription")}</p>
        </div>
        <Button variant="secondary" onPress={() => void load()}><Refresh2 size={17} />{t("common.refresh")}</Button>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,.8fr)]">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-bold">{t("admin.plans")}</h2><p className="text-xs text-muted">{toPersianDigits(activePlans.length)} {t("admin.activePlan")}</p></div>
            <Button size="sm" onPress={() => { setEditingId(null); setForm(emptyPlan); }}><Add size={17} />{t("admin.newPlan")}</Button>
          </div>
          {loading ? <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" /> : plans.length === 0 ? <p className="rounded-xl bg-surface-secondary p-5 text-sm text-muted">{t("admin.noSubscriptions")}</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => (
                <article key={plan._id} className={`rounded-2xl border p-4 ${plan.active ? "border-border" : "border-danger/30 opacity-65"}`}>
                  <div className="flex items-start justify-between gap-2"><div><h3 className="font-bold">{plan.name}</h3><p className="mt-0.5 text-xs text-muted">{plan.slug}</p></div><span className={`rounded-full px-2 py-1 text-[11px] ${plan.active ? "bg-success/10 text-success-foreground" : "bg-danger/10 text-danger"}`}>{plan.active ? t("admin.activePlan") : t("admin.inactivePlan")}</span></div>
                  <p className="mt-3 text-xl font-bold">{formatPrice(plan.price)} <span className="text-xs font-normal text-muted">{plan.priceUnit} / {plan.period}</span></p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{plan.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{plan.features.slice(0, 5).map((feature) => <span key={feature.key} className="rounded-full bg-accent/10 px-2 py-1 text-[11px] text-accent">{feature.label}</span>)}</div>
                  <div className="mt-4 flex gap-2"><Button size="sm" variant="secondary" onPress={() => { setEditingId(plan._id); setForm(toForm(plan)); }}><Edit2 size={15} />{t("common.edit")}</Button>{plan.active && <Button size="sm" variant="ghost" onPress={() => void archivePlan(plan._id)}><Trash size={15} />{t("admin.planArchived")}</Button>}</div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2"><Flash size={19} className="text-accent" variant="Bold" /><h2 className="text-lg font-bold">{t("admin.newPlan")}</h2></div>
          <div className="space-y-3">
            <input disabled={Boolean(editingId)} value={form.slug} onChange={(e) => updateForm("slug", e.target.value)} placeholder={t("admin.planSlug")} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder={t("admin.planName")} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
            <textarea value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder={t("admin.planDescription")} rows={2} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-2"><input type="number" value={form.price} onChange={(e) => updateForm("price", e.target.value)} placeholder={t("admin.planPrice")} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" /><select value={form.period} onChange={(e) => updateForm("period", e.target.value as SubscriptionPeriod)} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"><option value="monthly">monthly</option><option value="yearly">yearly</option><option value="lifetime">lifetime</option><option value="custom">custom</option></select></div>
            {form.period === "custom" && <input type="number" value={form.periodDays} onChange={(e) => updateForm("periodDays", e.target.value)} placeholder="روز" className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />}
            <textarea value={form.contactMessage} onChange={(e) => updateForm("contactMessage", e.target.value)} placeholder="پیام خرید" rows={2} className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
            <div className="flex items-center justify-between"><span className="text-sm font-semibold">{t("admin.planFeatures")}</span><Button size="sm" variant="ghost" onPress={() => updateForm("features", [...form.features, { key: `feature_${form.features.length + 1}`, label: "قابلیت جدید", description: "", enabled: true, limit: null }])}><Add size={16} />{t("admin.addFeature")}</Button></div>
            <div className="space-y-2">{form.features.map((feature, index) => <div key={`${feature.key}-${index}`} className="grid grid-cols-[1fr_1.2fr_100px_auto] gap-2"><input value={feature.key} onChange={(e) => { const next = [...form.features]; next[index] = { ...feature, key: e.target.value }; updateForm("features", next); }} placeholder={t("admin.featureKey")} className="min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-xs" /><input value={feature.label} onChange={(e) => { const next = [...form.features]; next[index] = { ...feature, label: e.target.value }; updateForm("features", next); }} placeholder={t("admin.featureLabel")} className="min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-xs" /><input type="number" min="0" value={feature.limit ?? ""} onChange={(e) => { const next = [...form.features]; next[index] = { ...feature, limit: e.target.value === "" ? null : Number(e.target.value) }; updateForm("features", next); }} placeholder={t("admin.featureLimit")} className="min-w-0 rounded-lg border border-border bg-surface px-2 py-2 text-xs" /><button type="button" className="text-danger" onClick={() => updateForm("features", form.features.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.highlighted} onChange={(e) => updateForm("highlighted", e.target.checked)} />{t("admin.highlighted")}</label>
            <Button className="w-full" isPending={saving} onPress={() => void savePlan()}>{saving ? t("common.save") : t("admin.savePlan")}</Button>
          </div>
        </div>
      </section>

      <section className="glass rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{t("admin.subscribers")}</h2><p className="text-sm text-muted">تخصیص دستی، بدون درگاه پرداخت</p></div><div className="flex flex-wrap gap-2"><select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"><option value="">{t("admin.selectUser")}</option>{users.map((user) => <option key={user._id} value={user._id}>{user.firstName} {user.lastName} — {user.mobile}</option>)}</select><select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} className="rounded-xl border border-border bg-surface px-3 py-2 text-sm"><option value="">{t("admin.selectPlan")}</option>{activePlans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name}</option>)}</select><Button onPress={() => void assign()} isDisabled={!selectedUser || !selectedPlan}>{t("admin.assign")}</Button></div></div>
        {subscriptions.length === 0 ? <p className="rounded-xl bg-surface-secondary p-5 text-sm text-muted">{t("admin.noSubscriptions")}</p> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="text-muted"><tr><th className="px-3 py-2 text-start">کاربر</th><th className="px-3 py-2 text-start">پلن</th><th className="px-3 py-2 text-start">وضعیت</th><th className="px-3 py-2 text-start">انقضا</th><th /></tr></thead><tbody>{subscriptions.map((subscription) => <tr key={subscription._id} className="border-t border-border/50"><td className="px-3 py-3">{subscription.user?.firstName} {subscription.user?.lastName}<span className="block text-xs text-muted">{subscription.user?.mobile}</span></td><td className="px-3 py-3">{subscription.plan?.name ?? subscription.planSnapshot?.name}</td><td className="px-3 py-3">{subscription.status}</td><td className="px-3 py-3">{subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString("fa-IR") : "∞"}</td><td className="px-3 py-3 text-end">{subscription.status === "active" && <Button size="sm" variant="ghost" onPress={() => void revoke(subscription._id)}>{t("admin.revoke")}</Button>}</td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}
