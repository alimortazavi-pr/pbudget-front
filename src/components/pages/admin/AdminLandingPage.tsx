"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label, TextArea } from "@heroui/react";

import * as adminApi from "@/common/api/admin";
import type { ILandingContent } from "@/common/interfaces/landing.interface";
import { DEFAULT_LANDING_CONTENT } from "@/components/pages/landing/landing-data";
import { PATHS } from "@/common/constants";
import { showToast } from "@/common/utils/toast";

type Tab =
  | "preview"
  | "hero"
  | "features"
  | "why"
  | "how"
  | "about"
  | "marquee"
  | "pricing"
  | "faq"
  | "contact"
  | "seo"
  | "settings"
  | "json";

const TABS: { id: Tab; label: string }[] = [
  { id: "preview", label: t("auto.kf07d7cd0f1") },
  { id: "hero", label: t("auto.k12dbf04ec5") },
  { id: "features", label: t("auto.kd4caaca0fc") },
  { id: "pricing", label: t("auto.kda41ea65ff") },
  { id: "why", label: t("auto.kecb737becf") },
  { id: "how", label: t("auto.k482bd94856") },
  { id: "about", label: t("auto.kba5089cab5") },
  { id: "marquee", label: t("auto.k23b90c86dc") },
  { id: "faq", label: t("auto.k168566fcba") },
  { id: "contact", label: t("auto.k1098073806") },
  { id: "seo", label: "SEO" },
  { id: "settings", label: t("nav.settings") },
  { id: "json", label: "JSON" },
];

export function AdminLandingPage() {
  const { t } = useTranslation();
  const listDelimiterPattern = new RegExp(
    `[,${t("common.listSeparator").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`,
  );
  const [tab, setTab] = useState<Tab>("preview");
  const [content, setContent] = useState<ILandingContent>(DEFAULT_LANDING_CONTENT);
  const [jsonText, setJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchAdminLanding();
      setContent(data.content);
      setJsonText(JSON.stringify(data.content, null, 2));
      setUpdatedAt(data.updatedAt);
      setHasDraftChanges(Boolean(data.hasDraftChanges));
    } catch {
      showToast(t("auto.k6596578282"), "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    try {
      let payload = content;
      if (tab === "json") {
        payload = JSON.parse(jsonText) as ILandingContent;
      }
      const result = await adminApi.updateAdminLanding(payload);
      setContent(result.content);
      setJsonText(JSON.stringify(result.content, null, 2));
      setUpdatedAt(result.updatedAt);
      setHasDraftChanges(true);
      showToast(t("auto.k38c8884e0f"), "success");
    } catch {
      showToast(t("auto.kcda46705e1"), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setPublishing(true);
    try {
      const result = await adminApi.publishAdminLanding();
      setContent(result.content);
      setJsonText(JSON.stringify(result.content, null, 2));
      setUpdatedAt(result.updatedAt);
      setHasDraftChanges(false);
      showToast(t("auto.kc005a5ef2a"), "success");
    } catch {
      showToast(t("auto.kcacc626ee5"), "danger");
    } finally {
      setPublishing(false);
    }
  }

  function resetDefaults() {
    if (!confirm(t("auto.kaa4bfbdc0d"))) return;
    setContent(DEFAULT_LANDING_CONTENT);
    setJsonText(JSON.stringify(DEFAULT_LANDING_CONTENT, null, 2));
  }

  if (loading) {
    return <div className="glass h-64 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">{t("auto.kb802a89d24")}</h3>
          <p className="text-sm text-muted">
            {t("auto.k719bec13ba")}
          </p>
          {hasDraftChanges ? (
            <p className="mt-1 text-xs font-medium text-amber-600">
              {t("auto.ka20cf9bab4")}
            </p>
          ) : null}
          {updatedAt ? (
            <p className="mt-1 text-xs text-muted">
              {t("auto.k6bf450e005")}{new Date(updatedAt).toLocaleString("fa-IR")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onPress={resetDefaults}>
            {t("auto.k523e2d7ccf")}
          </Button>
          <Button variant="secondary" onPress={() => void save()} isDisabled={saving}>
            {saving ? t("auto.k4d58255c24") : t("auto.k680bae05b4")}
          </Button>
          <Button
            onPress={() => void publish()}
            isDisabled={publishing || !hasDraftChanges}
          >
            {publishing ? t("auto.kf99c58e806") : t("auto.k68e323cdb5")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button
            key={t.id}
            size="sm"
            variant={tab === t.id ? "secondary" : "ghost"}
            onPress={() => setTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <section className="glass rounded-2xl p-6">
        {tab === "preview" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {t("auto.kbb3388903a")}
            </p>
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <iframe
                title={t("auto.ke1ae8a6b52")}
                src={PATHS.LANDING_PREVIEW}
                className="h-[min(70vh,720px)] w-full"
              />
            </div>
          </div>
        ) : null}

        {tab === "hero" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("auto.k81e70d784f")} value={content.hero.badge} onChange={(v) => setContent({ ...content, hero: { ...content.hero, badge: v } })} />
            <Field label={t("common.title")} value={content.hero.title} onChange={(v) => setContent({ ...content, hero: { ...content.hero, title: v } })} />
            <Field label={t("auto.k628dcf48b2")} value={content.hero.tagline} onChange={(v) => setContent({ ...content, hero: { ...content.hero, tagline: v } })} />
            <Field label={t("auto.k38a02ed7f4")} value={content.hero.primaryCta} onChange={(v) => setContent({ ...content, hero: { ...content.hero, primaryCta: v } })} />
            <Field label={t("auto.k5b581720b3")} value={content.hero.secondaryCta} onChange={(v) => setContent({ ...content, hero: { ...content.hero, secondaryCta: v } })} />
            <div className="md:col-span-2">
              <Label className="text-sm">{t("common.description")}</Label>
              <TextArea className="mt-1 w-full" value={content.hero.description} onChange={(e) => setContent({ ...content, hero: { ...content.hero, description: e.target.value } })} rows={3} />
            </div>
          </div>
        ) : null}

        {tab === "features" ? (
          <div className="space-y-4">
            {content.features.map((f, i) => (
              <div key={f.id} className="rounded-xl border border-border p-4">
                <Field label={t("common.title")} value={f.title} onChange={(v) => { const features = [...content.features]; features[i] = { ...f, title: v }; setContent({ ...content, features }); }} />
                <div className="mt-2">
                  <Label className="text-sm">{t("common.description")}</Label>
                  <TextArea className="mt-1 w-full" value={f.description} onChange={(e) => { const features = [...content.features]; features[i] = { ...f, description: e.target.value }; setContent({ ...content, features }); }} rows={2} />
                </div>
                <Field label={t("auto.k41ffb9a4a9")} value={f.tags.join(t("auto.k8715d7bc59"))} onChange={(v) => { const features = [...content.features]; features[i] = { ...f, tags: v.split(listDelimiterPattern).map((tag) => tag.trim()).filter(Boolean) }; setContent({ ...content, features }); }} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "pricing" ? (
          <div className="space-y-6">
            <Field label={t("auto.k24a7381c9b")} value={content.pricing.eyebrow} onChange={(v) => setContent({ ...content, pricing: { ...content.pricing, eyebrow: v } })} />
            <Field label={t("common.title")} value={content.pricing.title} onChange={(v) => setContent({ ...content, pricing: { ...content.pricing, title: v } })} />
            <TextArea value={content.pricing.description} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, description: e.target.value } })} rows={2} />
            {content.pricing.plans.map((plan, i) => (
              <div key={plan.id} className="rounded-xl border border-border p-4 space-y-3">
                <Field label={t("auto.ka971bb3a4c")} value={plan.name} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, name: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label={t("auto.kac261e2b72")} value={plan.price} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, price: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                  <Field label={t("auto.ke2b4ef1f7f")} value={plan.period} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, period: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                </div>
                <TextArea value={plan.description} onChange={(e) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, description: e.target.value }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} rows={2} />
                <Field label={t("auto.k41e1acdd96")} value={plan.features.join(t("auto.k8715d7bc59"))} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, features: v.split(listDelimiterPattern).map((s) => s.trim()).filter(Boolean) }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                <Field label={t("auto.ka870869a72")} value={plan.cta} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, cta: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={plan.highlighted} onChange={(e) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, highlighted: e.target.checked }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                  {t("auto.k9679b66fbf")}
                </label>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "why" ? (
          <div className="space-y-4">
            {content.whyUs.map((item, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <Field label={t("common.title")} value={item.title} onChange={(v) => { const whyUs = [...content.whyUs]; whyUs[i] = { ...item, title: v }; setContent({ ...content, whyUs }); }} />
                <TextArea className="mt-2 w-full" value={item.description} onChange={(e) => { const whyUs = [...content.whyUs]; whyUs[i] = { ...item, description: e.target.value }; setContent({ ...content, whyUs }); }} rows={2} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "how" ? (
          <div className="space-y-4">
            {content.howSteps.map((step, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <Field label={t("auto.ke3c475359a")} value={step.step} onChange={(v) => { const howSteps = [...content.howSteps]; howSteps[i] = { ...step, step: v }; setContent({ ...content, howSteps }); }} />
                <Field label={t("common.title")} value={step.title} onChange={(v) => { const howSteps = [...content.howSteps]; howSteps[i] = { ...step, title: v }; setContent({ ...content, howSteps }); }} />
                <TextArea className="mt-2 w-full" value={step.description} onChange={(e) => { const howSteps = [...content.howSteps]; howSteps[i] = { ...step, description: e.target.value }; setContent({ ...content, howSteps }); }} rows={2} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "about" ? (
          <div className="grid gap-4">
            <Field label={t("common.title")} value={content.about.title} onChange={(v) => setContent({ ...content, about: { ...content.about, title: v } })} />
            {content.about.paragraphs.map((p, i) => (
              <TextArea key={i} value={p} onChange={(e) => { const paragraphs = [...content.about.paragraphs]; paragraphs[i] = e.target.value; setContent({ ...content, about: { ...content.about, paragraphs } }); }} rows={3} />
            ))}
          </div>
        ) : null}

        {tab === "marquee" ? (
          <Field label={t("auto.k7ac8c172a9")} value={content.marquee.join(t("auto.k8715d7bc59"))} onChange={(v) => setContent({ ...content, marquee: v.split(listDelimiterPattern).map((s) => s.trim()).filter(Boolean) })} />
        ) : null}

        {tab === "seo" ? (
          <div className="grid gap-4">
            <Field label={t("auto.ke430427416")} value={content.seo.title} onChange={(v) => setContent({ ...content, seo: { ...content.seo, title: v } })} />
            <TextArea value={content.seo.description} onChange={(e) => setContent({ ...content, seo: { ...content.seo, description: e.target.value } })} rows={3} />
            <Field label="OG Image URL" value={content.seo.ogImageUrl} onChange={(v) => setContent({ ...content, seo: { ...content.seo, ogImageUrl: v } })} />
          </div>
        ) : null}

        {tab === "faq" ? (
          <div className="space-y-4">
            {content.faq.map((item, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <Field label={t("auto.k1396064729")} value={item.q} onChange={(v) => { const faq = [...content.faq]; faq[i] = { ...item, q: v }; setContent({ ...content, faq }); }} />
                <div className="mt-2">
                  <Label className="text-sm">{t("auto.kc121b28dc8")}</Label>
                  <TextArea className="mt-1 w-full" value={item.a} onChange={(e) => { const faq = [...content.faq]; faq[i] = { ...item, a: e.target.value }; setContent({ ...content, faq }); }} rows={2} />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "contact" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("common.title")} value={content.contact.title} onChange={(v) => setContent({ ...content, contact: { ...content.contact, title: v } })} />
            <Field label={t("auto.k9e6c42e4fb")} value={content.contact.email} onChange={(v) => setContent({ ...content, contact: { ...content.contact, email: v } })} />
            <Field label={t("auto.kca3d2562e4")} value={content.contact.telegram} onChange={(v) => setContent({ ...content, contact: { ...content.contact, telegram: v } })} />
            <Field label={t("auto.kcca7c12538")} value={content.contact.phone} onChange={(v) => setContent({ ...content, contact: { ...content.contact, phone: v } })} />
            <div className="md:col-span-2">
              <TextArea value={content.contact.description} onChange={(e) => setContent({ ...content, contact: { ...content.contact, description: e.target.value } })} rows={2} />
            </div>
          </div>
        ) : null}

        {tab === "settings" ? (
          <div className="grid gap-4 max-w-md">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={content.settings.downloadComingSoon} onChange={(e) => setContent({ ...content, settings: { ...content.settings, downloadComingSoon: e.target.checked } })} />
              {t("auto.k2e383e6b7d")}
            </label>
            <Field label={t("auto.kf33100f2c7")} value={content.settings.downloadLabel} onChange={(v) => setContent({ ...content, settings: { ...content.settings, downloadLabel: v } })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={content.settings.showAppDownloadInNav} onChange={(e) => setContent({ ...content, settings: { ...content.settings, showAppDownloadInNav: e.target.checked } })} />
              {t("auto.kcef36aad20")}
            </label>
          </div>
        ) : null}

        {tab === "json" ? (
          <TextArea className="w-full font-mono text-xs" dir="ltr" value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={24} />
        ) : null}
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
