"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Dropdown, Label, Modal } from "@heroui/react";
import { Add, Copy, Flash, More, Trash } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import * as paymentCardsApi from "@/common/api/payment-cards";
import * as profileApi from "@/common/api/profile";
import * as projectsApi from "@/common/api/projects";
import * as templatesApi from "@/common/api/transaction-templates";
import { PATHS } from "@/common/constants";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import type { IProject } from "@/common/interfaces/project.interface";
import type { ITransactionTemplate } from "@/common/interfaces/transaction-template.interface";
import { getNowDateParts } from "@/common/utils";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { showActionToast, showErrorToast, showToast } from "@/common/utils/toast";
import { mergeProfileWallet } from "@/common/utils/wallet-balances";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { TemplateFormModal, type TemplatePreset } from "@/components/pages/templates/TemplateFormModal";
import { useTranslation } from "@/i18n";
import { bumpBudgetRevision } from "@/stores/budget";
import { categoriesSelector } from "@/stores/category";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setProfile, userSelector } from "@/stores/profile";

const STARTERS: { key: "lunch" | "fuel" | "salary"; type: "0" | "1" }[] = [
  { key: "lunch", type: "1" },
  { key: "fuel", type: "1" },
  { key: "salary", type: "0" },
];

function TemplatesInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useSearchParams();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const calendar = user?.preferences?.dateCalendar ?? DEFAULT_USER_PREFERENCES.dateCalendar;

  const [templates, setTemplates] = useState<ITransactionTemplate[]>([]);
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ open: boolean; template: ITransactionTemplate | null; preset?: TemplatePreset }>({
    open: false,
    template: null,
  });
  const [removing, setRemoving] = useState<ITransactionTemplate | null>(null);
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    try {
      setTemplates(await templatesApi.fetchTemplates());
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void paymentCardsApi.fetchPaymentCards().then(setCards).catch(() => setCards([]));
    void projectsApi.fetchProjects().then(setProjects).catch(() => setProjects([]));
  }, [load]);

  // "+ قالب جدید" in the transaction form links here.
  useEffect(() => {
    if (params.get("new") === "1") {
      setForm({ open: true, template: null });
      router.replace(PATHS.TEMPLATES);
    }
  }, [params, router]);

  const money = (amount: number) => formatPriceWithCurrency(amount, currency);
  const categoryTitle = (id: string | null) => (id ? (categories ?? []).find((item) => item._id === id)?.title : undefined);
  const cardTitle = (id: string | null) => (id ? cards.find((item) => item._id === id)?.title : undefined);
  const projectTitle = (id: string | null) => (id ? projects.find((item) => item._id === id)?.category?.title : undefined);

  const shown = useMemo(() => {
    const q = query.trim();
    if (!q) return templates;
    return templates.filter((item) => `${item.title} ${categoryTitle(item.category) ?? ""}`.includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lookups depend on the same lists
  }, [templates, query, categories]);

  async function registerToday(template: ITransactionTemplate) {
    // Without an amount or a category there is nothing to save yet: open the prefilled form instead.
    if (!(template.price > 0) || !template.category) {
      router.push(`${PATHS.CREATE_BUDGET}?template=${template._id}`);
      return;
    }
    setBusyId(template._id);
    try {
      const now = getNowDateParts(calendar);
      const payload: Record<string, string> = {
        price: String(template.price),
        type: String(template.type),
        category: template.category,
        year: String(now.year),
        month: String(now.month),
        day: String(now.day),
        description: template.description ?? "",
        paymentCardId: template.paymentCard ?? "",
        currency,
        dateCalendar: calendar,
      };
      if (template.project) payload.projectId = template.project;
      const res = await budgetsApi.createBudget(payload);
      void templatesApi.markTemplateUsed(template._id).then(load).catch(() => undefined);
      dispatch(bumpBudgetRevision());
      if (user) dispatch(setProfile(mergeProfileWallet(user, res)));
      else void profileApi.fetchProfile().then((p) => dispatch(setProfile(p))).catch(() => undefined);
      showActionToast(
        t("feat.templates.registered", { title: template.title, amount: money(template.price) }),
        t("feat.templates.showIt"),
        () => router.push(PATHS.BUDGET(res.budget._id)),
      );
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusyId("");
    }
  }

  async function duplicate(template: ITransactionTemplate) {
    try {
      await templatesApi.createTemplate({
        title: t("feat.templates.copyTitle", { title: template.title }).slice(0, 60),
        type: String(template.type) as "0" | "1",
        price: String(template.price),
        categoryId: template.category ?? undefined,
        paymentCardId: template.paymentCard ?? undefined,
        projectId: template.project ?? undefined,
        description: template.description || undefined,
      });
      showToast(t("feat.templates.copied"), "success");
      await load();
    } catch (error) {
      showErrorToast(error);
    }
  }

  async function remove() {
    if (!removing) return;
    setBusyId(removing._id);
    try {
      await templatesApi.deleteTemplate(removing._id);
      showToast(t("common.deleted"), "success");
      setRemoving(null);
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusyId("");
    }
  }

  const uses = templates.reduce((sum, item) => sum + item.usageCount, 0);

  return (
    <div className="space-y-5">
      <PageHeroSection
        variant="violet"
        eyebrow={t("feat.templates.eyebrow")}
        title={t("nav.templates")}
        description={t("feat.templates.subtitle")}
        aside={
          <Button
            className="bg-white/95 font-semibold text-violet-700"
            data-testid="template-add"
            onPress={() => setForm({ open: true, template: null })}
          >
            <Add size={18} />
            {t("feat.templates.add")}
          </Button>
        }
        footer={
          templates.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="pb-wallet-chip">{t("feat.templates.countChip", { count: templates.length })}</span>
              {uses > 0 ? <span className="pb-wallet-chip">{t("feat.templates.usesChip", { count: uses })}</span> : null}
            </div>
          ) : null
        }
      />

      {templates.length > 8 ? (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("feat.templates.search")}
          aria-label={t("feat.templates.search")}
          className="h-11 w-full rounded-2xl border border-border/60 bg-surface px-4 text-sm outline-none focus:border-accent"
        />
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pb-shimmer h-44 rounded-3xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <section className="pb-pop flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-12 text-center" data-testid="templates-empty">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600">
            <Flash size={30} variant="Bulk" />
          </span>
          <p className="font-bold">{t("feat.templates.emptyTitle")}</p>
          <p className="mt-1 max-w-sm text-sm leading-7 text-muted">{t("feat.templates.emptyHint")}</p>
          <Button className="mt-5" onPress={() => setForm({ open: true, template: null })}>
            <Add size={18} />
            {t("feat.templates.firstTemplate")}
          </Button>
          <p className="mt-6 text-xs text-muted">{t("feat.templates.startersLabel")}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {STARTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setForm({ open: true, template: null, preset: { title: t(`feat.templates.starter.${item.key}`), type: item.type } })}
                className="pb-press cursor-pointer rounded-full border border-border/60 bg-surface px-4 py-1.5 text-sm font-medium hover:border-accent/50"
              >
                <span
                  aria-hidden
                  className={`me-1.5 inline-block size-1.5 rounded-full align-middle ${item.type === "0" ? "bg-[var(--brand-teal)]" : "bg-[var(--brand-rose)]"}`}
                />
                {t(`feat.templates.starter.${item.key}`)}
              </button>
            ))}
          </div>
        </section>
      ) : shown.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{t("feat.templates.noMatch")}</p>
      ) : (
        <div className="pb-card-grid !gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="templates-list">
          {shown.map((template) => {
            const income = template.type === 0;
            const chips = [categoryTitle(template.category), cardTitle(template.paymentCard), projectTitle(template.project)].filter(Boolean) as string[];
            return (
              <article
                key={template._id}
                className="pb-box pb-lift flex flex-col !p-4"
                style={{ ["--tone" as string]: income ? "var(--brand-teal)" : "var(--brand-rose)" }}
                data-testid="template-card"
              >
                <div className="relative z-[1] flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                      <span className={`size-2 rounded-full ${income ? "bg-[var(--brand-teal)]" : "bg-[var(--brand-rose)]"}`} />
                      {income ? t("budget.income") : t("budget.expense")}
                    </p>
                    <h3 className="line-clamp-2 break-words font-bold leading-6" title={template.title}>
                      {template.title}
                    </h3>
                  </div>
                  <Dropdown>
                    <Dropdown.Trigger className="pb-icon-btn -me-1.5 -mt-1" aria-label={t("feat.templates.menuAria")}>
                      <More size={20} />
                    </Dropdown.Trigger>
                    <Dropdown.Popover>
                      <Dropdown.Menu
                        aria-label={t("feat.templates.menuAria")}
                        onAction={(key) => (key === "copy" ? void duplicate(template) : setRemoving(template))}
                      >
                        <Dropdown.Item id="copy" textValue={t("feat.templates.copy")}>
                          <Copy size={16} />
                          <Label>{t("feat.templates.copy")}</Label>
                        </Dropdown.Item>
                        <Dropdown.Item id="delete" textValue={t("common.delete")} variant="danger">
                          <Trash size={16} />
                          <Label>{t("common.delete")}</Label>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </div>

                <p className={`relative z-[1] mt-2 break-words ${template.price > 0 ? "text-xl font-extrabold tracking-tight" : "text-sm text-muted"}`}>
                  {template.price > 0 ? money(template.price) : t("feat.templates.askEachTime")}
                </p>

                {chips.length ? (
                  <div className="relative z-[1] mt-2.5 flex flex-wrap gap-1.5">
                    {chips.map((chip) => (
                      <span key={chip} className="max-w-full truncate rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-medium">
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="relative z-[1] mt-2 text-[11px] text-muted">
                  {template.usageCount > 0
                    ? t("feat.templates.usedTimes", { count: template.usageCount })
                    : t("feat.templates.neverUsed")}
                </p>

                <div className="relative z-[1] mt-auto grid grid-cols-[1fr_auto] gap-2 pt-3">
                  <Button size="sm" className="pb-press w-full" isPending={busyId === template._id} onPress={() => void registerToday(template)}>
                    {t("feat.templates.useToday")}
                  </Button>
                  <Button size="sm" variant="secondary" className="pb-press" onPress={() => setForm({ open: true, template })}>
                    {t("common.edit")}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <TemplateFormModal
        open={form.open}
        template={form.template}
        preset={form.preset}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
        onSaved={() => void load()}
      />

      <AppModal open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader>
            <Modal.Heading>{t("feat.templates.removeTitle", { title: removing?.title ?? "" })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">{t("feat.templates.removeBody")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setRemoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={Boolean(busyId)} onPress={() => void remove()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}

export function TemplatesPage() {
  return (
    <Suspense fallback={null}>
      <TemplatesInner />
    </Suspense>
  );
}
