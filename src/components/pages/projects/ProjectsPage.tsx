"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Add, Briefcase, Clock } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as projectsApi from "@/common/api/projects";
import type { IProject } from "@/common/interfaces/project.interface";
import { formatPrice, formatCount } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { CreateProjectModal } from "@/components/pages/projects/CreateProjectModal";
import { ProjectStatus } from "@/types/enums";

function statusLabel(status: IProject["status"]) {
  if (status === ProjectStatus.COMPLETED) return "تمام‌شده";
  if (status === ProjectStatus.ON_HOLD) return "متوقف";
  return "فعال";
}

function statusClass(status: IProject["status"]) {
  if (status === ProjectStatus.COMPLETED) return "bg-income-soft text-income";
  if (status === ProjectStatus.ON_HOLD) return "bg-surface-secondary text-muted";
  return "bg-accent/15 text-accent";
}

export function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<IProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await projectsApi.fetchProjects();
      setProjects(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        const stats = project.stats;
        acc.total += project.totalAmount;
        acc.received += stats?.receivedAmount ?? 0;
        acc.remaining += stats?.remainingAmount ?? 0;
        return acc;
      },
      { total: 0, received: 0, remaining: 0 },
    );
  }, [projects]);

  const usedCategoryIds = useMemo(
    () => new Set(projects.map((project) => project.category._id)),
    [projects],
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">مدیریت پروژه‌ها</p>
        <h1 className="mt-1 text-2xl font-bold">پروژه‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          مبلغ کل قرارداد، پرداخت‌های خرد و یادداشت‌های جلسه را در یک جا ببینید.
        </p>
      </section>

      {projects.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">مجموع قراردادها</p>
            <p className="mt-2 text-xl font-bold">{formatPrice(summary.total)}</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">دریافت‌شده</p>
            <p className="mt-2 text-xl font-bold text-income">
              {formatPrice(summary.received)}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-sm text-muted">باقی‌مانده</p>
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
              تحلیل کلی حضور و غیاب
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
        <div className="glass rounded-2xl p-10 text-center text-muted">در حال بارگذاری…</div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Briefcase size={40} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">هنوز پروژه‌ای ثبت نشده</p>
          <Button className="mt-4" onPress={() => setCreateOpen(true)}>
            <Add size={18} />
            اولین پروژه
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
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
                        {project.category?.title ?? "بدون عنوان"}
                      </h2>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-medium ${statusClass(project.status)}`}
                      >
                        {statusLabel(project.status)}
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
                    <p className="text-muted">کل</p>
                    <p className="mt-1 font-semibold">{formatPrice(project.totalAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-income-soft/50 p-2">
                    <p className="text-muted">دریافت</p>
                    <p className="mt-1 font-semibold text-income">{formatPrice(received)}</p>
                  </div>
                  <div className="rounded-xl bg-expense-soft/50 p-2">
                    <p className="text-muted">مانده</p>
                    <p className="mt-1 font-semibold text-expense">{formatPrice(remaining)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted">
                    <span>پیشرفت دریافت</span>
                    <span>{Math.round(progress)}٪</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
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
