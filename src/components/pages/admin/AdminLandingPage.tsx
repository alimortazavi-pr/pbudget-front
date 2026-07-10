"use client";

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
  { id: "preview", label: "پیش‌نمایش" },
  { id: "hero", label: "هیرو" },
  { id: "features", label: "امکانات" },
  { id: "pricing", label: "قیمت‌ها" },
  { id: "why", label: "چرا ما" },
  { id: "how", label: "نحوه کار" },
  { id: "about", label: "درباره" },
  { id: "marquee", label: "مارکی" },
  { id: "faq", label: "سوالات" },
  { id: "contact", label: "تماس" },
  { id: "seo", label: "SEO" },
  { id: "settings", label: "تنظیمات" },
  { id: "json", label: "JSON" },
];

export function AdminLandingPage() {
  const { t } = useTranslation();
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
      showToast(t("بارگذاری لندینگ ناموفق بود"), "danger");
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
      showToast(t("پیش‌نویس ذخیره شد — برای انتشار دکمه «انتشار» را بزنید"), "success");
    } catch {
      showToast(t("ذخیره ناموفق — JSON را بررسی کنید"), "danger");
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
      showToast(t("لندینگ منتشر شد"), "success");
    } catch {
      showToast(t("انتشار ناموفق بود"), "danger");
    } finally {
      setPublishing(false);
    }
  }

  function resetDefaults() {
    if (!confirm("بازگشت به پیش‌فرض؟")) return;
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
          <h3 className="text-lg font-bold">{t("صفحه لندینگ")}</h3>
          <p className="text-sm text-muted">
            ویرایش پیش‌نویس — پس از «انتشار» برای بازدیدکنندگان اعمال می‌شود
          </p>
          {hasDraftChanges ? (
            <p className="mt-1 text-xs font-medium text-amber-600">
              پیش‌نویس ذخیره‌شده — هنوز منتشر نشده
            </p>
          ) : null}
          {updatedAt ? (
            <p className="mt-1 text-xs text-muted">
              آخرین بروزرسانی: {new Date(updatedAt).toLocaleString("fa-IR")}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onPress={resetDefaults}>
            پیش‌فرض
          </Button>
          <Button variant="secondary" onPress={() => void save()} isDisabled={saving}>
            {saving ? "در حال ذخیره…" : "ذخیره پیش‌نویس"}
          </Button>
          <Button
            onPress={() => void publish()}
            isDisabled={publishing || !hasDraftChanges}
          >
            {publishing ? "در حال انتشار…" : "انتشار"}
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
              پیش‌نمایش پیش‌نویس — ابتدا «ذخیره پیش‌نویس» را بزنید.
            </p>
            <div className="overflow-hidden rounded-2xl border border-border bg-background">
              <iframe
                title={t("پیش‌نمایش لندینگ")}
                src={PATHS.LANDING_PREVIEW}
                className="h-[min(70vh,720px)] w-full"
              />
            </div>
          </div>
        ) : null}

        {tab === "hero" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("بج")} value={content.hero.badge} onChange={(v) => setContent({ ...content, hero: { ...content.hero, badge: v } })} />
            <Field label={t("عنوان")} value={content.hero.title} onChange={(v) => setContent({ ...content, hero: { ...content.hero, title: v } })} />
            <Field label={t("زیرعنوان")} value={content.hero.tagline} onChange={(v) => setContent({ ...content, hero: { ...content.hero, tagline: v } })} />
            <Field label={t("دکمه اصلی")} value={content.hero.primaryCta} onChange={(v) => setContent({ ...content, hero: { ...content.hero, primaryCta: v } })} />
            <Field label={t("دکمه ثانویه")} value={content.hero.secondaryCta} onChange={(v) => setContent({ ...content, hero: { ...content.hero, secondaryCta: v } })} />
            <div className="md:col-span-2">
              <Label className="text-sm">{t("توضیح")}</Label>
              <TextArea className="mt-1 w-full" value={content.hero.description} onChange={(e) => setContent({ ...content, hero: { ...content.hero, description: e.target.value } })} rows={3} />
            </div>
          </div>
        ) : null}

        {tab === "features" ? (
          <div className="space-y-4">
            {content.features.map((f, i) => (
              <div key={f.id} className="rounded-xl border border-border p-4">
                <Field label={t("عنوان")} value={f.title} onChange={(v) => { const features = [...content.features]; features[i] = { ...f, title: v }; setContent({ ...content, features }); }} />
                <div className="mt-2">
                  <Label className="text-sm">{t("توضیح")}</Label>
                  <TextArea className="mt-1 w-full" value={f.description} onChange={(e) => { const features = [...content.features]; features[i] = { ...f, description: e.target.value }; setContent({ ...content, features }); }} rows={2} />
                </div>
                <Field label={t("تگ‌ها (با کاما)")} value={f.tags.join("، ")} onChange={(v) => { const features = [...content.features]; features[i] = { ...f, tags: v.split(/[,،]/).map((t) => t.trim()).filter(Boolean) }; setContent({ ...content, features }); }} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "pricing" ? (
          <div className="space-y-6">
            <Field label={t("عنوان کوچک")} value={content.pricing.eyebrow} onChange={(v) => setContent({ ...content, pricing: { ...content.pricing, eyebrow: v } })} />
            <Field label={t("عنوان")} value={content.pricing.title} onChange={(v) => setContent({ ...content, pricing: { ...content.pricing, title: v } })} />
            <TextArea value={content.pricing.description} onChange={(e) => setContent({ ...content, pricing: { ...content.pricing, description: e.target.value } })} rows={2} />
            {content.pricing.plans.map((plan, i) => (
              <div key={plan.id} className="rounded-xl border border-border p-4 space-y-3">
                <Field label={t("نام پلن")} value={plan.name} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, name: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label={t("قیمت")} value={plan.price} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, price: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                  <Field label={t("دوره")} value={plan.period} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, period: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                </div>
                <TextArea value={plan.description} onChange={(e) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, description: e.target.value }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} rows={2} />
                <Field label={t("ویژگی‌ها (با کاما)")} value={plan.features.join("، ")} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, features: v.split(/[,،]/).map((s) => s.trim()).filter(Boolean) }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                <Field label={t("دکمه CTA")} value={plan.cta} onChange={(v) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, cta: v }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={plan.highlighted} onChange={(e) => { const plans = [...content.pricing.plans]; plans[i] = { ...plan, highlighted: e.target.checked }; setContent({ ...content, pricing: { ...content.pricing, plans } }); }} />
                  پلن برجسته
                </label>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "why" ? (
          <div className="space-y-4">
            {content.whyUs.map((item, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <Field label={t("عنوان")} value={item.title} onChange={(v) => { const whyUs = [...content.whyUs]; whyUs[i] = { ...item, title: v }; setContent({ ...content, whyUs }); }} />
                <TextArea className="mt-2 w-full" value={item.description} onChange={(e) => { const whyUs = [...content.whyUs]; whyUs[i] = { ...item, description: e.target.value }; setContent({ ...content, whyUs }); }} rows={2} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "how" ? (
          <div className="space-y-4">
            {content.howSteps.map((step, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <Field label={t("شماره")} value={step.step} onChange={(v) => { const howSteps = [...content.howSteps]; howSteps[i] = { ...step, step: v }; setContent({ ...content, howSteps }); }} />
                <Field label={t("عنوان")} value={step.title} onChange={(v) => { const howSteps = [...content.howSteps]; howSteps[i] = { ...step, title: v }; setContent({ ...content, howSteps }); }} />
                <TextArea className="mt-2 w-full" value={step.description} onChange={(e) => { const howSteps = [...content.howSteps]; howSteps[i] = { ...step, description: e.target.value }; setContent({ ...content, howSteps }); }} rows={2} />
              </div>
            ))}
          </div>
        ) : null}

        {tab === "about" ? (
          <div className="grid gap-4">
            <Field label={t("عنوان")} value={content.about.title} onChange={(v) => setContent({ ...content, about: { ...content.about, title: v } })} />
            {content.about.paragraphs.map((p, i) => (
              <TextArea key={i} value={p} onChange={(e) => { const paragraphs = [...content.about.paragraphs]; paragraphs[i] = e.target.value; setContent({ ...content, about: { ...content.about, paragraphs } }); }} rows={3} />
            ))}
          </div>
        ) : null}

        {tab === "marquee" ? (
          <Field label={t("آیتم‌ها (با کاما)")} value={content.marquee.join("، ")} onChange={(v) => setContent({ ...content, marquee: v.split(/[,،]/).map((s) => s.trim()).filter(Boolean) })} />
        ) : null}

        {tab === "seo" ? (
          <div className="grid gap-4">
            <Field label={t("عنوان SEO")} value={content.seo.title} onChange={(v) => setContent({ ...content, seo: { ...content.seo, title: v } })} />
            <TextArea value={content.seo.description} onChange={(e) => setContent({ ...content, seo: { ...content.seo, description: e.target.value } })} rows={3} />
            <Field label="OG Image URL" value={content.seo.ogImageUrl} onChange={(v) => setContent({ ...content, seo: { ...content.seo, ogImageUrl: v } })} />
          </div>
        ) : null}

        {tab === "faq" ? (
          <div className="space-y-4">
            {content.faq.map((item, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <Field label={t("سوال")} value={item.q} onChange={(v) => { const faq = [...content.faq]; faq[i] = { ...item, q: v }; setContent({ ...content, faq }); }} />
                <div className="mt-2">
                  <Label className="text-sm">{t("پاسخ")}</Label>
                  <TextArea className="mt-1 w-full" value={item.a} onChange={(e) => { const faq = [...content.faq]; faq[i] = { ...item, a: e.target.value }; setContent({ ...content, faq }); }} rows={2} />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "contact" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("عنوان")} value={content.contact.title} onChange={(v) => setContent({ ...content, contact: { ...content.contact, title: v } })} />
            <Field label={t("ایمیل")} value={content.contact.email} onChange={(v) => setContent({ ...content, contact: { ...content.contact, email: v } })} />
            <Field label={t("تلگرام")} value={content.contact.telegram} onChange={(v) => setContent({ ...content, contact: { ...content.contact, telegram: v } })} />
            <Field label={t("تلفن")} value={content.contact.phone} onChange={(v) => setContent({ ...content, contact: { ...content.contact, phone: v } })} />
            <div className="md:col-span-2">
              <TextArea value={content.contact.description} onChange={(e) => setContent({ ...content, contact: { ...content.contact, description: e.target.value } })} rows={2} />
            </div>
          </div>
        ) : null}

        {tab === "settings" ? (
          <div className="grid gap-4 max-w-md">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={content.settings.downloadComingSoon} onChange={(e) => setContent({ ...content, settings: { ...content.settings, downloadComingSoon: e.target.checked } })} />
              اپ موبایل — به‌زودی (بدون لینک دانلود)
            </label>
            <Field label={t("متن دکمه اپ")} value={content.settings.downloadLabel} onChange={(v) => setContent({ ...content, settings: { ...content.settings, downloadLabel: v } })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={content.settings.showAppDownloadInNav} onChange={(e) => setContent({ ...content, settings: { ...content.settings, showAppDownloadInNav: e.target.checked } })} />
              نمایش دکمه اپ در نوار بالا
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
