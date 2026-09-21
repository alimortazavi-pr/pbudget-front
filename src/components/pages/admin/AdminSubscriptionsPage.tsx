"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Label, Switch, TextArea, TextField } from "@heroui/react";
import { Add, Crown, Edit2, Flash, Refresh2, Trash } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import * as subscriptionApi from "@/common/api/subscriptions";
import { SUBSCRIPTION_FEATURE_CATALOG } from "@/common/constants/subscription-features";
import type { AdminUser } from "@/common/interfaces/admin";
import type { SubscriptionFeature, SubscriptionPlan, SubscriptionPeriod, UserSubscription } from "@/common/interfaces/subscription.interface";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormSelect } from "@/components/common/form/FormFields";
import { useTranslation } from "@/components/providers/LanguageProvider";

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

function createEmptyPlan(): PlanForm {
  return {
    slug: "", name: "", description: "", price: "0", priceUnit: "تومان",
    period: "monthly", periodDays: "30", highlighted: false, active: true,
    sortOrder: "0", contactMessage: "برای خرید و فعال‌سازی با ادمین تماس بگیرید.", features: [],
  };
}

function toForm(plan?: SubscriptionPlan): PlanForm {
  if (!plan) return createEmptyPlan();
  return {
    slug: plan.slug, name: plan.name, description: plan.description, price: String(plan.price),
    priceUnit: plan.priceUnit, period: plan.period, periodDays: String(plan.periodDays ?? ""),
    highlighted: plan.highlighted, active: plan.active, sortOrder: String(plan.sortOrder),
    contactMessage: plan.contactMessage, features: plan.features.map((feature) => ({ ...feature })),
  };
}

function AdminTextInput({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; disabled?: boolean }) {
  return <TextField className="gap-1.5"><Label className="text-sm font-medium">{label}</Label><Input variant="secondary" type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></TextField>;
}

function AdminTextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <TextField className="gap-1.5"><Label className="text-sm font-medium">{label}</Label><TextArea variant="secondary" rows={2} value={value} onChange={(event) => onChange(event.target.value)} /></TextField>;
}

function periodLabel(period: SubscriptionPeriod, t: (key: string) => string) {
  if (period === "monthly") return t("admin.periodMonthly");
  if (period === "yearly") return t("admin.periodYearly");
  if (period === "lifetime") return t("admin.periodLifetime");
  return t("admin.periodCustom");
}

export function AdminSubscriptionsPage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [form, setForm] = useState<PlanForm>(() => createEmptyPlan());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextPlans, nextSubscriptions, userResult] = await Promise.all([
        subscriptionApi.fetchAdminSubscriptionPlans(), subscriptionApi.fetchAdminSubscriptions({ limit: 100 }), adminApi.fetchAdminUsers({ limit: 100 }),
      ]);
      setPlans(nextPlans); setSubscriptions(nextSubscriptions.items); setUsers(userResult.items);
    } catch { showToast(t("common.error"), "danger"); } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const activePlans = useMemo(() => plans.filter((plan) => plan.active), [plans]);
  const updateForm = <K extends keyof PlanForm>(key: K, value: PlanForm[K]) => setForm((current) => ({ ...current, [key]: value }));

  function startNew() { setEditingId(null); setForm(createEmptyPlan()); }

  function updateFeature(index: number, patch: Partial<SubscriptionFeature>) {
    const next = [...form.features]; next[index] = { ...next[index], ...patch }; updateForm("features", next);
  }

  function setCatalogFeatureEnabled(key: string, enabled: boolean) {
    const catalogFeature = SUBSCRIPTION_FEATURE_CATALOG.find((feature) => feature.key === key);
    if (!catalogFeature) return;
    const index = form.features.findIndex((feature) => feature.key === key);
    if (index >= 0) {
      updateFeature(index, { enabled, label: catalogFeature.label });
      return;
    }
    updateForm("features", [...form.features, { key, label: catalogFeature.label, description: "", enabled, limit: null }]);
  }

  function setCatalogFeatureLimit(key: string, limit: number | null) {
    const index = form.features.findIndex((feature) => feature.key === key);
    if (index >= 0) {
      updateFeature(index, { limit });
      return;
    }
    const next = [...form.features, { key, label: SUBSCRIPTION_FEATURE_CATALOG.find((feature) => feature.key === key)?.label ?? key, description: "", enabled: true, limit }];
    updateForm("features", next);
  }

  function planFeaturesForSave() {
    const catalogFeatures = SUBSCRIPTION_FEATURE_CATALOG.map((catalogFeature) => {
      const existing = form.features.find((feature) => feature.key === catalogFeature.key);
      return existing ?? { key: catalogFeature.key, label: catalogFeature.label, description: "", enabled: false, limit: null };
    });
    const customFeatures = form.features.filter((feature) => !SUBSCRIPTION_FEATURE_CATALOG.some((catalogFeature) => catalogFeature.key === feature.key));
    return [...catalogFeatures, ...customFeatures];
  }

  async function savePlan() {
    if (!form.name.trim() || (!editingId && !form.slug.trim())) { showToast(t("admin.planRequired"), "warning"); return; }
    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim(), name: form.name.trim(), description: form.description.trim(), price: Number(form.price) || 0,
        priceUnit: form.priceUnit.trim() || "تومان", period: form.period,
        periodDays: form.period === "custom" ? Number(form.periodDays) || null : undefined,
        highlighted: form.highlighted, active: form.active, sortOrder: Number(form.sortOrder) || 0,
        contactMessage: form.contactMessage.trim(), features: planFeaturesForSave(),
      };
      if (editingId) await subscriptionApi.updateAdminSubscriptionPlan(editingId, payload);
      else await subscriptionApi.createAdminSubscriptionPlan(payload as Parameters<typeof subscriptionApi.createAdminSubscriptionPlan>[0]);
      showToast(t("admin.planSaved"), "success"); startNew(); await load();
    } catch { showToast(t("common.saveFailed"), "danger"); } finally { setSaving(false); }
  }

  async function archivePlan(id: string) {
    if (!window.confirm(t("admin.archivePlanConfirm", { name: t("admin.plans") }))) return;
    try { await subscriptionApi.archiveAdminSubscriptionPlan(id); showToast(t("admin.planArchived"), "success"); await load(); } catch { showToast(t("common.error"), "danger"); }
  }

  async function assign() {
    if (!selectedUser || !selectedPlan) return;
    try { await subscriptionApi.assignAdminSubscription({ userId: selectedUser, planId: selectedPlan }); showToast(t("admin.subscriptionSaved"), "success"); setSelectedUser(""); setSelectedPlan(""); await load(); } catch { showToast(t("common.error"), "danger"); }
  }

  async function revoke(id: string) {
    try { await subscriptionApi.revokeAdminSubscription(id); await load(); } catch { showToast(t("common.error"), "danger"); }
  }

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Crown size={24} variant="Bold" /></div><div><h1 className="text-2xl font-bold tracking-tight">{t("admin.subscriptionsTitle")}</h1><p className="mt-1 max-w-2xl text-sm text-muted">{t("admin.subscriptionsDescription")}</p></div></div>
        <Button variant="secondary" onPress={() => void load()}><Refresh2 size={17} />{t("common.refresh")}</Button>
      </header>

      <section className="glass rounded-3xl p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{t("admin.plans")}</h2><p className="mt-1 text-xs text-muted">{toPersianDigits(activePlans.length)} {t("admin.activePlan")}</p></div><Button size="sm" onPress={startNew}><Add size={17} />{t("admin.newPlan")}</Button></div>
        {loading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-2xl bg-surface-secondary" /><div className="h-48 animate-pulse rounded-2xl bg-surface-secondary" /></div> : plans.length === 0 ? <p className="rounded-2xl bg-surface-secondary p-6 text-sm text-muted">{t("admin.noSubscriptions")}</p> : <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">{plans.map((plan) => <article key={plan._id} className={`flex min-h-56 flex-col rounded-2xl border p-5 ${plan.active ? "border-border/70 bg-surface/50" : "border-danger/30 bg-danger/5 opacity-70"}`}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold">{plan.name}</h3><p className="mt-1 font-mono text-[11px] text-muted" dir="ltr">{plan.slug}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${plan.active ? "bg-success/10 text-success-foreground" : "bg-danger/10 text-danger"}`}>{plan.active ? t("admin.activePlan") : t("admin.inactivePlan")}</span></div>
          <p className="mt-4 text-2xl font-bold" dir="rtl">{formatPrice(plan.price)} <span className="text-xs font-normal text-muted">{plan.priceUnit} / {periodLabel(plan.period, t)}</span></p><p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted">{plan.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{plan.features.filter((feature) => feature.enabled).slice(0, 6).map((feature) => <span key={feature.key} className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] text-accent">{feature.label}</span>)}</div>
          <div className="mt-auto flex flex-wrap gap-2 pt-5"><Button size="sm" variant="secondary" onPress={() => { setEditingId(plan._id); setForm(toForm(plan)); }}><Edit2 size={15} />{t("common.edit")}</Button>{plan.active && <Button size="sm" variant="ghost" onPress={() => void archivePlan(plan._id)}><Trash size={15} />{t("admin.planArchived")}</Button>}</div>
        </article>)}</div>}
      </section>

      <section className="glass rounded-3xl p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Flash size={19} className="text-accent" variant="Bold" /><div><h2 className="text-lg font-bold">{editingId ? t("admin.editPlan") : t("admin.newPlan")}</h2><p className="mt-1 text-xs text-muted">{t("admin.planEditorHint")}</p></div></div>{editingId && <Button size="sm" variant="ghost" onPress={startNew}>{t("admin.cancelEdit")}</Button>}</div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,.9fr)]">
          <div className="grid gap-4 sm:grid-cols-2"><AdminTextInput label={t("admin.planSlug")} value={form.slug} disabled={Boolean(editingId)} onChange={(value) => updateForm("slug", value)} /><AdminTextInput label={t("admin.planName")} value={form.name} onChange={(value) => updateForm("name", value)} /><AdminTextInput label={t("admin.planPrice")} type="number" value={form.price} onChange={(value) => updateForm("price", value)} /><AdminTextInput label={t("admin.priceUnit")} value={form.priceUnit} onChange={(value) => updateForm("priceUnit", value)} /><FormSelect label={t("admin.planPeriod")} selectedKey={form.period} onSelectionChange={(key) => updateForm("period", key as SubscriptionPeriod)} options={[{ id: "monthly", label: t("admin.periodMonthly") }, { id: "yearly", label: t("admin.periodYearly") }, { id: "lifetime", label: t("admin.periodLifetime") }, { id: "custom", label: t("admin.periodCustom") }]} />{form.period === "custom" && <AdminTextInput label={t("admin.periodDays")} type="number" value={form.periodDays} onChange={(value) => updateForm("periodDays", value)} />}<div className="sm:col-span-2"><AdminTextArea label={t("admin.planDescription")} value={form.description} onChange={(value) => updateForm("description", value)} /></div><div className="sm:col-span-2"><AdminTextArea label={t("admin.contactMessage")} value={form.contactMessage} onChange={(value) => updateForm("contactMessage", value)} /></div><div className="flex flex-wrap gap-5 sm:col-span-2"><label className="flex items-center gap-2 text-sm"><Switch isSelected={form.highlighted} onChange={(selected) => updateForm("highlighted", selected)} size="sm"><Switch.Control><Switch.Thumb /></Switch.Control></Switch>{t("admin.highlighted")}</label><label className="flex items-center gap-2 text-sm"><Switch isSelected={form.active} onChange={(selected) => updateForm("active", selected)} size="sm"><Switch.Control><Switch.Thumb /></Switch.Control></Switch>{t("admin.activePlan")}</label></div></div>
          <div className="rounded-2xl border border-border/70 bg-surface/40 p-4"><div className="mb-4"><h3 className="font-bold">{t("admin.planFeatures")}</h3><p className="mt-1 text-xs text-muted">{t("admin.featureEditorHint")}</p></div><div className="grid gap-3 sm:grid-cols-2">{SUBSCRIPTION_FEATURE_CATALOG.map((catalogFeature) => { const configured = form.features.find((feature) => feature.key === catalogFeature.key); const enabled = configured?.enabled === true; return <div key={catalogFeature.key} className={`rounded-2xl border p-3 transition-colors ${enabled ? "border-accent/40 bg-accent/5" : "border-border/60 bg-surface"}`}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2"><div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${enabled ? "bg-accent/15 text-accent" : "bg-surface-secondary text-muted"}`}>{enabled ? "✓" : "—"}</div><div className="min-w-0"><p className="font-semibold">{t(catalogFeature.labelKey)}</p><p className="mt-0.5 font-mono text-[10px] text-muted" dir="ltr">{catalogFeature.key}</p></div></div><Switch aria-label={t(catalogFeature.labelKey)} isSelected={enabled} onChange={(selected) => setCatalogFeatureEnabled(catalogFeature.key, selected)} size="sm"><Switch.Control><Switch.Thumb /></Switch.Control></Switch></div><Input aria-label={t("admin.featureLimit")} variant="secondary" type="number" min="0" value={configured?.limit == null ? "" : String(configured.limit)} onChange={(event) => setCatalogFeatureLimit(catalogFeature.key, event.target.value === "" ? null : Number(event.target.value))} placeholder={t("admin.featureLimit")} className="mt-3" disabled={!enabled} /></div>; })}</div></div>
        </div><div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border/70 pt-5"><Button variant="ghost" onPress={startNew}>{t("admin.cancelEdit")}</Button><Button className="min-w-40" isPending={saving} onPress={() => void savePlan()}>{saving ? t("common.save") : t("admin.savePlan")}</Button></div>
      </section>

      <section className="glass rounded-3xl p-4 sm:p-6"><div id="subscription-assignment" className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-lg font-bold">{t("admin.subscribers")}</h2><p className="mt-1 text-sm text-muted">{t("admin.manualActivationHint")}</p></div><div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[minmax(220px,1fr)_minmax(180px,1fr)_auto] sm:items-end"><FormSelect label={t("admin.selectUser")} selectedKey={selectedUser} onSelectionChange={setSelectedUser} options={users.map((user) => ({ id: user._id, label: `${user.firstName} ${user.lastName} — ${user.mobile}` }))} /><FormSelect label={t("admin.selectPlan")} selectedKey={selectedPlan} onSelectionChange={setSelectedPlan} options={activePlans.map((plan) => ({ id: plan._id, label: plan.name }))} /><Button onPress={() => void assign()} isDisabled={!selectedUser || !selectedPlan}>{t("admin.assign")}</Button></div></div>{subscriptions.length === 0 ? <p className="rounded-2xl bg-surface-secondary p-6 text-sm text-muted">{t("admin.noSubscriptions")}</p> : <div className="overflow-x-auto rounded-2xl border border-border/60"><table className="min-w-[820px] w-full text-sm"><thead className="bg-surface-secondary/60 text-muted"><tr><th className="px-4 py-3 text-start">{t("admin.userColumn")}</th><th className="px-4 py-3 text-start">{t("admin.planColumn")}</th><th className="px-4 py-3 text-start">{t("admin.statusColumn")}</th><th className="px-4 py-3 text-start">{t("admin.expiresColumn")}</th><th className="px-4 py-3 text-end" /></tr></thead><tbody>{subscriptions.map((subscription) => <tr key={subscription._id} className="border-t border-border/50"><td className="px-4 py-3">{subscription.user?.firstName} {subscription.user?.lastName}<span className="mt-0.5 block text-xs text-muted" dir="ltr">{subscription.user?.mobile}</span></td><td className="px-4 py-3">{subscription.plan?.name ?? subscription.planSnapshot?.name}</td><td className="px-4 py-3"><span className="rounded-full bg-accent/10 px-2 py-1 text-xs text-accent">{subscription.status}</span></td><td className="px-4 py-3">{subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString("fa-IR") : "∞"}</td><td className="px-4 py-3 text-end"><div className="flex justify-end gap-2">{subscription.user?._id && <Button size="sm" variant="secondary" onPress={() => { setSelectedUser(subscription.user?._id ?? ""); setSelectedPlan(""); document.getElementById("subscription-assignment")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>{t("admin.changePlan")}</Button>}{subscription.status === "active" && <Button size="sm" variant="ghost" onPress={() => void revoke(subscription._id)}>{t("admin.revoke")}</Button>}</div></td></tr>)}</tbody></table></div>}</section>
    </div>
  );
}
