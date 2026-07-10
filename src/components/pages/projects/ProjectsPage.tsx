"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Add, Briefcase, Clock, Login } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as projectsApi from "@/common/api/projects";
import * as workTimeApi from "@/common/api/work-time";
import type { IProject } from "@/common/interfaces/project.interface";
import { formatPrice, formatCount } from "@/common/utils";
import { formatDailyRemainingMessage } from "@/common/hooks/useWorkSessionDailyReminder";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { CreateProjectModal } from "@/components/pages/projects/CreateProjectModal";
import { ProjectStatus } from "@/types/enums";

function statusLabel(status: IProject["status"], t: (key: string) => string) {
  if (status === ProjectStatus.COMPLETED) return t("pages.projects.statusCompleted");
  if (status === ProjectStatus.ON_HOLD) return t("pages.projects.statusOnHold");
  return t("pages.projects.statusActive");
}

function statusClass(status: IProject["status"]) {
  if (status === ProjectStatus.COMPLETED) return "bg-income-soft text-income";
  if (status === ProjectStatus.ON_HOLD) return "bg-surface-secondary text-muted";
  return "bg-accent/15 text-accent";
}

export function ProjectsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [clockLoadingId, setClockLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await projectsApi.fetchProjects();
      setProjects(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("pages.projects.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleProjects = useMemo(() => {
    const showSynced = typeof window !== "undefined" && localStorage.getItem("pbudget_show_synced_projects") !== "false";
    if (showSynced) return projects;
    return projects.filter((p) => !p.description?.includes("Synced from Business"));
  }, [projects]);

  const summary = useMemo(() => {
    return visibleProjects.reduce(
      (acc, project) => {
        const stats = project.stats;
        acc.total += project.totalAmount;
        acc.received += stats?.receivedAmount ?? 0;
        acc.remaining += stats?.remainingAmount ?? 0;
        return acc;
      },
      { total: 0, received: 0, remaining: 0 },
    );
  }, [visibleProjects]);

  const usedCategoryIds = useMemo(
    () => new Set(visibleProjects.map((project) => project.category._id)),
    [visibleProjects],
  );

  async function handleQuickClockIn(projectId: string) {
    setClockLoadingId(projectId);
    try {
      const result = await workTimeApi.clockIn(projectId);
      const msg = formatDailyRemainingMessage(result.dailyStatus);
      showToast(msg ? `${t("pages.projects.clockInRecorded")} · ${msg}` : t("pages.projects.clockInRecorded"), "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setClockLoadingId(null);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <PageHeroSection
        variant="violet"
        eyebrow={t("pageHero.projects.eyebrow")}
        title={t("nav.projects")}
        description={t("pageHero.projects.description")}
      />

      {projects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.k277c53ca60")}</p>
            <p className="mt-2 text-xl font-bold">{formatPrice(summary.total)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("auto.kc95929267d")}</p>
            <p className="mt-2 text-xl font-bold text-income">
              {formatPrice(summary.received)}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">{t("debts.remaining")}</p>
            <p className="mt-2 text-xl font-bold text-expense">
              {formatPrice(summary.remaining)}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">{formatCount(projects.length)} پروژه</p>
        <div className="flex flex-wrap gap-2">
          <Link href={PATHS.WORK_ATTENDANCE}>
            <Button size="sm" variant="secondary">
              <Clock size={18} />
              حضور و غیاب
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-accent text-accent-foreground"
            onPress={() => setCreateOpen(true)}
          >
            <Add size={18} />
            پروژه جدید
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("common.loading")}</div>
      ) : visibleProjects.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Briefcase size={40} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">{t("auto.kf26286709b")}</p>
          <Button className="mt-4" onPress={() => setCreateOpen(true)}>
            <Add size={18} />
            اولین پروژه
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleProjects.map((project) => {
            const stats = project.stats;
            const received = stats?.receivedAmount ?? 0;
            const remaining = stats?.remainingAmount ?? project.totalAmount;
            const progress =
              project.totalAmount > 0
                ? Math.min((received / project.totalAmount) * 100, 100)
                : 0;

            return (
              <Link
                key={project._id}
                href={PATHS.PROJECT(project._id)}
                className="block glass rounded-2xl p-4 transition hover:border-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-bold">
                        {project.category?.title ?? t("pages.projects.noTitle")}
                      </h2>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-medium ${statusClass(project.status)}`}
                      >
                        {statusLabel(project.status, t)}
                      </span>
                      {project.fixedIncome ? (
                        <span className="rounded-lg bg-income-soft px-2 py-0.5 text-xs font-medium text-income">
                          درآمد ثابت
                        </span>
                      ) : null}
                      {!project.trackWorkTime ? (
                        <span className="rounded-lg bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                          بدون ساعت کاری
                        </span>
                      ) : null}
                      {project.accessRole === "partner" ? (
                        <span className="rounded-lg bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                          مشترک
                        </span>
                      ) : null}
                    </div>
                    {project.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {project.description}
                      </p>
                    ) : null}
                  </div>
                  <Briefcase size={22} className="shrink-0 text-accent" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-surface-secondary p-2">
                    <p className="text-muted">{project.fixedIncome ? t("pages.projects.labelSalary") : t("pages.projects.labelTotal")}</p>
                    <p className="mt-1 font-semibold">{formatPrice(project.totalAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-income-soft/50 p-2">
                    <p className="text-muted">{project.fixedIncome ? t("pages.projects.labelThisMonth") : t("pages.projects.labelReceived")}</p>
                    <p className="mt-1 font-semibold text-income">{formatPrice(received)}</p>
                  </div>
                  <div className="rounded-xl bg-expense-soft/50 p-2">
                    <p className="text-muted">{t("pages.projects.labelRemaining")}</p>
                    <p className="mt-1 font-semibold text-expense">{formatPrice(remaining)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>{t("auto.k033ab31f95")}</span>
                    <span>{Math.round(progress)}٪</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div
                  className="mt-3 flex flex-wrap items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  role="presentation"
                >
                  {project.trackWorkTime ? (
                    <>
                      <Button
                        size="sm"
                        className="bg-income text-white"
                        isPending={clockLoadingId === project._id}
                        onPress={() => void handleQuickClockIn(project._id)}
                      >
                        <Login size={16} />
                        ورود
                      </Button>
                      <Link
                        href={PATHS.PROJECT_ATTENDANCE(project._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex"
                      >
                        <Button size="sm" variant="secondary">
                          <Clock size={16} />
                          حضور
                        </Button>
                      </Link>
                    </>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        usedCategoryIds={usedCategoryIds}
        onCreated={(id) => router.push(PATHS.PROJECT(id))}
      />
    </div>
  );
}
