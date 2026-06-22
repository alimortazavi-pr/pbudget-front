"use client";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@heroui/react";

import * as projectsApi from "@/common/api/projects";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IProject } from "@/common/interfaces/project.interface";
import { FormSelect } from "@/components/common/form/FormFields";

export type ProjectLedgerValue = {
  enabled: boolean;
  projectId: string;
};

type ProjectLedgerSectionProps = {
  value: ProjectLedgerValue;
  onChange: (patch: Partial<ProjectLedgerValue>) => void;
  isProjectCategory: boolean;
  categoryTitle?: string;
};

type LinkedProjectSummaryProps = {
  project: NonNullable<IBudget["project"]>;
};

function resolveProjectId(project: IBudget["project"]): string {
  if (!project) return "";
  if (typeof project === "string") return project;
  return project._id;
}

function resolveProjectTitle(project: NonNullable<IBudget["project"]>): string {
  if (typeof project === "string") return "پروژه";
  return project.category?.title ?? "پروژه";
}

export function LinkedProjectSummary({ project }: LinkedProjectSummaryProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <p className="text-sm font-medium">مرتبط با پروژه</p>
      <div className="rounded-xl bg-accent/10 px-3 py-3 text-sm text-accent">
        <p className="font-semibold">{resolveProjectTitle(project)}</p>
      </div>
      <p className="text-xs leading-6 text-muted">
        این تراکنش در صفحه پروژه‌ها نمایش داده می‌شود. برای تغییر اتصال، دسته‌بندی یا
        پروژه را از بخش بیشتر ویرایش کنید.
      </p>
    </div>
  );
}

export function ProjectLedgerSection({
  value,
  onChange,
  isProjectCategory,
  categoryTitle,
}: ProjectLedgerSectionProps) {
  const [projects, setProjects] = useState<IProject[]>([]);

  useEffect(() => {
    if (!value.enabled) return;
    void projectsApi
      .fetchProjects()
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [value.enabled]);

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        id: project._id,
        label: project.category?.title ?? "پروژه",
      })),
    [projects],
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">مرتبط با پروژه</p>
          <p className="mt-1 text-xs text-muted">
            ثبت تراکنش در حساب یک پروژه مشخص
          </p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(selected) => onChange({ enabled: selected })}
          size="sm"
          aria-label="مرتبط با پروژه"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {isProjectCategory && !value.enabled ? (
        <p className="rounded-xl bg-accent/10 px-3 py-2 text-xs leading-6 text-accent">
          با دسته «{categoryTitle}» این تراکنش خودکار به پروژه مرتبط وصل می‌شود.
        </p>
      ) : null}

      {value.enabled ? (
        <div className="space-y-3 border-t border-border/40 pt-3">
          <FormSelect
            label="کدام پروژه؟"
            placeholder="یک پروژه انتخاب کنید"
            selectedKey={value.projectId || undefined}
            onSelectionChange={(key) => onChange({ projectId: key })}
            options={projectOptions}
            emptyMessage="پروژه‌ای ثبت نشده"
          />
          <p className="text-xs leading-6 text-muted">
            تراکنش در صفحه پروژه و گزارش‌های مالی آن نمایش داده می‌شود.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { resolveProjectId };
