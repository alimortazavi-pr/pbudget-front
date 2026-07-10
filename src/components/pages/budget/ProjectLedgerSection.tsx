"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

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

function resolveProjectTitle(
  project: NonNullable<IBudget["project"]>,
  t: (key: string) => string,
): string {
  if (typeof project === "string") return t("common.project");
  return project.category?.title ?? t("common.project");
}

export function LinkedProjectSummary({ project }: LinkedProjectSummaryProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <p className="text-sm font-medium">{t("auto.k3cabc7ed28")}</p>
      <div className="rounded-xl bg-accent/10 px-3 py-3 text-sm text-accent">
        <p className="font-semibold">{resolveProjectTitle(project, t)}</p>
      </div>
      <p className="text-xs leading-6 text-muted">
        {t(
          "این تراکنش در صفحه پروژه‌ها نمایش داده می‌شود. برای تغییر اتصال، دسته‌بندی یا پروژه را از بخش بیشتر ویرایش کنید.",
        )}
      </p>
    </div>
  );
}

export function ProjectLedgerSection({
  value,
  onChange,
  isProjectCategory,
  categoryTitle,
}: ProjectLedgerSectionProps) {  const { t } = useTranslation();

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
        label: project.category?.title ?? t("common.project"),
      })),
    [projects, t],
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("auto.k3cabc7ed28")}</p>
          <p className="mt-1 text-xs text-muted">
            {t("ثبت تراکنش در حساب یک پروژه مشخص")}
          </p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(selected) => onChange({ enabled: selected })}
          size="sm"
          aria-label={t("auto.k3cabc7ed28")}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {isProjectCategory && !value.enabled ? (
        <p className="rounded-xl bg-accent/10 px-3 py-2 text-xs leading-6 text-accent">
          {t("با دسته «{{category}}» این تراکنش خودکار به پروژه مرتبط وصل می‌شود.", {
            category: categoryTitle ?? "",
          })}
        </p>
      ) : null}

      {value.enabled ? (
        <div className="space-y-3 border-t border-border/40 pt-3">
          <FormSelect
            label={t("auto.kb91f3aa09a")}
            placeholder={t("auto.k87961dabdb")}
            selectedKey={value.projectId || undefined}
            onSelectionChange={(key) => onChange({ projectId: key })}
            options={projectOptions}
            emptyMessage={t("common.noItemsFound")}
          />
          <p className="text-xs leading-6 text-muted">
            {t("تراکنش در صفحه پروژه و گزارش‌های مالی آن نمایش داده می‌شود.")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { resolveProjectId };
