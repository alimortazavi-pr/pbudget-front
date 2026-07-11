"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Switch } from "@heroui/react";
import { Add, Clock, Edit2, Task, TaskSquare, Trash, Wallet } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as projectsApi from "@/common/api/projects";
import type { IProjectDetail, IProjectItem, ProjectStatus as ProjectStatusType } from "@/common/interfaces/project.interface";
import { formatJalaliDate, formatPrice, formatCount, toEnglishDigits } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AttachBudgetButton } from "@/components/common/budget/AttachBudgetModal";
import { FormInput, FormPriceInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { CreatePaymentPlanModal } from "@/components/pages/planning/CreatePaymentPlanModal";
import { ProjectWorkTimeTab } from "@/components/pages/projects/ProjectWorkTimeTab";
import { PartnersSection } from "@/components/pages/partners/PartnersSection";
import { ContextPlanningBoard } from "@/components/pages/planning/ContextPlanningBoard";
import { PartnerBudgetCard } from "@/components/pages/partners/PartnerBudgetCard";
import { ProjectItemType, ProjectStatus } from "@/types/enums";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";
import { userSelector } from "@/stores/profile";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";

type ProjectDetailPageProps = {
  projectId: string;
};

type TabId = "overview" | "transactions" | "installments" | "notebook" | "work" | "partners" | "board";

const STATUS_OPTIONS = [
  { id: ProjectStatus.ACTIVE, label: t("auto.k25c499f433") },
  { id: ProjectStatus.ON_HOLD, label: t("auto.k2e7aff1bdd") },
  { id: ProjectStatus.COMPLETED, label: t("auto.k6f126e2474") },
];

function itemTypeLabel(type: IProjectItem["type"]) {
  return type === ProjectItemType.TASK ? t("auto.k631b0dcd4d") : t("auto.k3ec8c91053");
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const currentUser = useAppSelector(userSelector);
  const [data, setData] = useState<IProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [status, setStatus] = useState<ProjectStatusType>(ProjectStatus.ACTIVE);
  const [description, setDescription] = useState("");
  const [fixedIncome, setFixedIncome] = useState(false);
  const [trackWorkTime, setTrackWorkTime] = useState(false);
  const [showWorkTimeOnDashboard, setShowWorkTimeOnDashboard] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");

  const [itemType, setItemType] = useState<ProjectItemType>(ProjectItemType.NOTE);
  const [itemContent, setItemContent] = useState("");
  const [itemSaving, setItemSaving] = useState(false);
  const [createPlanOpen, setCreatePlanOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await projectsApi.fetchProject(projectId);
      setData(detail);
      setTitle(detail.project.category?.title ?? "");
      setTotalAmount(String(detail.project.totalAmount));
      setStatus(detail.project.status);
      setDescription(detail.project.description ?? "");
      setFixedIncome(detail.project.fixedIncome ?? false);
      setTrackWorkTime(detail.project.trackWorkTime === true);
      setShowWorkTimeOnDashboard(detail.project.showWorkTimeOnDashboard === true);
      setHourlyRate(
        detail.project.hourlyRate ? String(detail.project.hourlyRate) : "",
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k0080763ff0"));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!trackWorkTime && tab === "work") {
      setTab("overview");
    }
  }, [trackWorkTime, tab]);

  const stats = data?.project.stats;
  const notes = useMemo(
    () => (data?.items ?? []).filter((item) => item.type === ProjectItemType.NOTE),
    [data?.items],
  );
  const tasks = useMemo(
    () => (data?.items ?? []).filter((item) => item.type === ProjectItemType.TASK),
    [data?.items],
  );

  async function saveOverview() {
    if (!data) return;
    if (!title.trim()) {
      showToast(t("auto.k1f14f2a9a4"));
      return;
    }

    setSaving(true);
    try {
      const updated = await projectsApi.updateProject(projectId, {
        title: title.trim(),
        totalAmount: toEnglishDigits(totalAmount),
        status,
        description: description.trim(),
        fixedIncome,
        trackWorkTime,
        showWorkTimeOnDashboard: trackWorkTime && showWorkTimeOnDashboard,
        hourlyRate: trackWorkTime && !fixedIncome ? toEnglishDigits(hourlyRate) : "0",
      });
      setData((current) =>
        current ? { ...current, project: { ...current.project, ...updated } } : current,
      );

      const categoryId = updated.category?._id;
      if (categoryId && categories) {
        dispatch(
          setCategories(
            categories.map((cat) =>
              cat._id === categoryId ? { ...cat, title: title.trim() } : cat,
            ),
          ),
        );
      }

      showToast(t("common.saved"), "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSaving(false);
    }
  }

  async function addItem() {
    if (!itemContent.trim()) {
      showToast(t("auto.k8e739070fb"));
      return;
    }
    setItemSaving(true);
    try {
      const item = await projectsApi.createProjectItem(projectId, {
        type: itemType,
        content: itemContent.trim(),
      });
      setData((current) =>
        current ? { ...current, items: [item, ...current.items] } : current,
      );
      setItemContent("");
      showToast(t("auto.ke55428888d"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setItemSaving(false);
    }
  }

  async function toggleTask(item: IProjectItem) {
    try {
      const updated = await projectsApi.updateProjectItem(projectId, item._id, {
        done: !item.done,
      });
      setData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((row) =>
                row._id === item._id ? updated : row,
              ),
            }
          : current,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    }
  }

  async function removeItem(item: IProjectItem) {
    try {
      await projectsApi.deleteProjectItem(projectId, item._id);
      setData((current) =>
        current
          ? { ...current, items: current.items.filter((row) => row._id !== item._id) }
          : current,
      );
      showToast(t("common.deleted"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    }
  }

  async function removeProject() {
    if (!confirm(t("auto.ke76eefff80"))) return;
    setDeleting(true);
    try {
      await projectsApi.deleteProject(projectId);
      showToast(t("auto.k490362a857"), "success");
      router.push(PATHS.PROJECTS);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setDeleting(false);
    }
  }

  const showWorkTime = trackWorkTime === true;
  const detailTabs = [
    { id: "overview" as const, label: t("nav.settings") },
    { id: "transactions" as const, label: t("auto.k4ad10a7f11") },
    { id: "installments" as const, label: t("auto.kc510fac6fc") },
    ...(showWorkTime ? [{ id: "work" as const, label: t("auto.k3ac227aa47") }] : []),
    { id: "partners" as const, label: t("auto.kae6a285197") },
    { id: "board" as const, label: t("auto.k11dd432167") },
    { id: "notebook" as const, label: t("auto.k8527309198") },
  ] as const;

  if (loading || !data) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted">{t("common.loading")}</div>
    );
  }

  const project = data.project;
  const isPartner =
    data.accessRole === "partner" || project.accessRole === "partner";
  const permissionLevel = data.permissionLevel ?? project.permissionLevel ?? "owner";
  const isEditorPartner = isPartner && permissionLevel === "editor";
  const canEditContent = !isPartner || isEditorPartner;
  const received = stats?.receivedAmount ?? 0;
  const spent = stats?.spentAmount ?? 0;
  const remaining = stats?.remainingAmount ?? 0;
  const profit = stats?.profitAmount ?? 0;
  const progress =
    project.totalAmount > 0 ? Math.min((received / project.totalAmount) * 100, 100) : 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="glass rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{t("auto.kcce7e8ff41")}</p>
            <h1 className="mt-1 text-2xl font-bold">{title || project.category?.title}</h1>
            {isPartner ? (
              <p className="mt-2 rounded-lg bg-accent/10 px-2 py-1 text-xs text-accent">
                {isEditorPartner
                  ? t("auto.k7827888609")
                  : t("auto.k0d7e2324b4")}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {showWorkTime ? (
              <Link href={PATHS.PROJECT_ATTENDANCE(projectId)}>
                <Button size="sm" className="bg-income text-white">
                  <Clock size={16} />
                  {t("auto.ka4b30b68b9")}
                </Button>
              </Link>
            ) : null}
            <Link href={`${PATHS.TASKS}?projectId=${projectId}&duration=daily`}>
              <Button size="sm" variant="secondary">
                <TaskSquare size={16} />
                {t("auto.k640fa32e68")}
              </Button>
            </Link>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xs text-muted">
              {project.fixedIncome ? t("auto.kc7cd90e6c9") : t("auto.k9515d72bb2")}
            </p>
            <p className="mt-1 font-bold">{formatPrice(project.totalAmount)}</p>
          </div>
          <div className="rounded-xl bg-income-soft/50 p-3">
            <p className="text-xs text-muted">
              {project.fixedIncome ? t("auto.kc1859dd238") : t("auto.kc95929267d")}
            </p>
            <p className="mt-1 font-bold text-income">{formatPrice(received)}</p>
          </div>
          <div className="rounded-xl bg-expense-soft/50 p-3">
            <p className="text-xs text-muted">
              {project.fixedIncome ? t("auto.k53fb64cecc") : t("debts.remaining")}
            </p>
            <p className="mt-1 font-bold text-expense">{formatPrice(remaining)}</p>
          </div>
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xs text-muted">{t("auto.k0df4572857")}</p>
            <p className={`mt-1 font-bold ${profit >= 0 ? "text-income" : "text-expense"}`}>
              {formatPrice(profit)}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{project.fixedIncome ? t("auto.kc8cc1ce9fc") : t("auto.k033ab31f95")}</span>
            <span>
              {t("projects.progressExpenseLine", {
                percent: Math.round(progress),
                amount: formatPrice(spent),
              })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {detailTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="glass space-y-4 rounded-2xl p-4">
          {isPartner ? (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                {description || t("auto.k841143dad5")}
              </p>
              <p className="text-sm">
                {t("auto.k372c3f9526")}{" "}
                {STATUS_OPTIONS.find((item) => item.id === status)?.label ?? status}
              </p>
            </div>
          ) : (
            <>
          <FormInput
            label={t("auto.ke5c0c0a1d9")}
            placeholder={t("auto.kf09a60a915")}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormPriceInput
            label={
              fixedIncome
                ? t("projects.monthlySalaryLabel", {
                    currency: currencyLabel(currentUser?.preferences?.currency ?? "toman"),
                  })
                : t("projects.contractTotalLabel", {
                    currency: currencyLabel(currentUser?.preferences?.currency ?? "toman"),
                  })
            }
            value={totalAmount}
            onChange={setTotalAmount}
          />
          <FormSelect
            label={t("auto.k2f3c6cf127")}
            selectedKey={status}
            onSelectionChange={(key) => setStatus(key as ProjectStatusType)}
            options={STATUS_OPTIONS}
          />
          <FormTextArea
            label={t("auto.k1e8529f4ec")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
            <div>
              <p className="text-sm font-medium">{t("auto.k5595ad5020")}</p>
              <p className="mt-1 text-xs text-muted">
                {t("auto.k2e15d7567d")}
              </p>
            </div>
            <Switch isSelected={trackWorkTime} onChange={setTrackWorkTime} size="sm">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>

          {trackWorkTime ? (
            <>
              <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
                <div>
                  <p className="text-sm font-medium">{t("auto.kebf7642934")}</p>
                  <p className="mt-1 text-xs text-muted">
                    {t("auto.kc457c6edbf")}
                  </p>
                </div>
                <Switch
                  isSelected={showWorkTimeOnDashboard}
                  onChange={setShowWorkTimeOnDashboard}
                  size="sm"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
                <div>
                  <p className="text-sm font-medium">{t("auto.kf5b9b58262")}</p>
                  <p className="mt-1 text-xs text-muted">
                    {t("auto.kfdb3125d3d")}
                  </p>
                </div>
                <Switch isSelected={fixedIncome} onChange={setFixedIncome} size="sm">
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
              </div>

              {!fixedIncome ? (
                <FormPriceInput
                  label={t("projects.hourlyRateLabel", {
                    currency: currencyLabel(currentUser?.preferences?.currency ?? "toman"),
                  })}
                  value={hourlyRate}
                  onChange={setHourlyRate}
                />
              ) : null}
              {!fixedIncome && hourlyRate ? (
                <p className="text-xs leading-6 text-muted">
                  {t("auto.k59409b83fe")}
                </p>
              ) : null}
            </>
          ) : null}

          <div className="border-t border-border/50 pt-4">
            <Button
              className="w-full"
              size="lg"
              onPress={() => void saveOverview()}
              isPending={saving}
            >
              {t("auto.k55d482e181")}
            </Button>
          </div>

          <section className="rounded-2xl border border-dashed border-danger/35 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">{t("common.dangerZone")}</p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {t("auto.k1bac28885f")}
              {t("auto.k1eb74a3fed")}
            </p>
            <Button
              className="mt-3"
              variant="danger"
              onPress={() => void removeProject()}
              isPending={deleting}
            >
              <Trash size={18} />
              {t("auto.k0a79125a53")}
            </Button>
          </section>
            </>
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {formatCount(data.budgets.length)} {t("auto.k737a2f99b3")}
            </p>
            <div className="flex flex-wrap gap-2">
              {canEditContent ? (
              <>
              <AttachBudgetButton
                title={t("auto.k90a573a5af")}
                description={t("auto.k763ef83edb")}
                context={{ type: "project", contextId: projectId }}
                selectionMode="multiple"
                onAttach={async (budgetId) => {
                  await projectsApi.attachProjectBudget(projectId, budgetId);
                  await load();
                }}
                onAttachMultiple={async (budgetIds) => {
                  await projectsApi.attachProjectBudgets(projectId, budgetIds);
                  await load();
                }}
              />
              <Link href={PATHS.CREATE_BUDGET}>
                <Button size="sm" variant="secondary">
                  <Add size={16} />
                  {t("auto.kc26f42387e")}
                </Button>
              </Link>
              </>
              ) : null}
            </div>
          </div>
          {data.budgets.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              {t("auto.k44a2b9b6a9")}
            </div>
          ) : (
            data.budgets.map((budget) => (
              <PartnerBudgetCard
                key={budget._id}
                budget={budget}
                currentUserId={currentUser?._id}
              />
            ))
          )}
        </div>
      )}

      {tab === "installments" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {formatCount(data.paymentPlans?.length ?? 0)} {t("auto.k0cc67dd6a3")}
            </p>
            {!isPartner ? (
            <Button size="sm" onPress={() => setCreatePlanOpen(true)}>
              <Add size={16} />
              {t("auto.k834506762c")}
            </Button>
            ) : null}
          </div>

          {(data.paymentPlans ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
              {t("auto.kc0b352afcc")}
            </p>
          ) : (
            (data.paymentPlans ?? []).map((plan) => (
              <Link
                key={plan._id}
                href={`${PATHS.INSTALLMENTS}/${plan._id}`}
                className="glass flex items-center justify-between gap-3 rounded-2xl p-4 transition hover:border-accent/40"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{plan.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatPrice(plan.amount)} · {t("auto.k6702edb75e")}{plan.dueDayOfMonth}
                    {plan.person ? ` · ${plan.person}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-accent" />
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      plan.active ? "bg-income-soft text-income" : "bg-surface-secondary text-muted"
                    }`}
                  >
                    {plan.active ? t("auto.k25c499f433") : t("auto.k7fdadc73ac")}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "partners" && (
        <PartnersSection
          contextType="project"
          contextId={projectId}
          readOnly={isPartner}
        />
      )}

      {tab === "board" && (
        <div className="glass rounded-2xl p-4">
          <ContextPlanningBoard
            contextType="project"
            contextId={projectId}
            readOnly={!canEditContent}
          />
        </div>
      )}

      {tab === "work" && showWorkTime && (
        <ProjectWorkTimeTab
          projectId={projectId}
          projectTitle={title || project.category?.title || t("auto.kcce7e8ff41")}
          fixedIncome={project.fixedIncome ?? false}
        />
      )}

      {tab === "notebook" && (
        <div className="space-y-4">
          {canEditContent ? (
          <div className="glass space-y-4 rounded-2xl p-4">
            <div className="flex gap-2">
              {(
                [
                  { id: ProjectItemType.NOTE, label: t("auto.k3ec8c91053") },
                  { id: ProjectItemType.TASK, label: t("auto.k631b0dcd4d") },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setItemType(item.id)}
                  className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium ${
                    itemType === item.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface-secondary text-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <FormTextArea
              label={itemType === ProjectItemType.TASK ? t("auto.k4e2c618bad") : t("auto.kcd836c190b")}
              placeholder={
                itemType === ProjectItemType.TASK
                  ? t("auto.kc46c1ade06")
                  : t("auto.kfb91ced46a")
              }
              value={itemContent}
              onChange={(e) => setItemContent(e.target.value)}
            />
            <Button onPress={() => void addItem()} isPending={itemSaving}>
              <Add size={18} />
              {t("auto.k15f2d066f9")}
            </Button>
          </div>
          ) : null}

          {tasks.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">{t("auto.k274d6d99eb")}</h3>
              {tasks.map((item) => (
                <article key={item._id} className="glass flex items-start gap-3 rounded-2xl p-4">
                  {canEditContent ? (
                  <Switch
                    isSelected={item.done}
                    onChange={() => void toggleTask(item)}
                    size="sm"
                    aria-label={t("common.done")}
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                  ) : (
                    <span className="text-xs text-muted">{item.done ? "✓" : "○"}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-7 ${
                        item.done ? "text-muted line-through" : ""
                      }`}
                    >
                      {item.content}
                    </p>
                  </div>
                  {canEditContent ? (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => void removeItem(item)}
                  >
                    <Trash size={16} />
                  </Button>
                  ) : null}
                </article>
              ))}
            </section>
          )}

          {notes.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-muted">{t("nav.notes")}</h3>
              {notes.map((item) => (
                <article key={item._id} className="glass rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-7 whitespace-pre-wrap">{item.content}</p>
                    {canEditContent ? (
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => void removeItem(item)}
                    >
                      <Trash size={16} />
                    </Button>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-muted">{itemTypeLabel(item.type)}</p>
                </article>
              ))}
            </section>
          )}

          {notes.length === 0 && tasks.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              {t("auto.kc83994b716")}
            </div>
          )}
        </div>
      )}

      <CreatePaymentPlanModal
        open={createPlanOpen}
        onOpenChange={setCreatePlanOpen}
        defaultProjectId={projectId}
        onCreated={() => {
          void load();
          setTab("installments");
        }}
      />
    </div>
  );
}
