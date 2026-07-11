"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useState } from "react";
import { Button } from "@heroui/react";

import type { IProject } from "@/common/interfaces/project.interface";
import { ManualWorkSessionModal } from "@/components/pages/projects/ManualWorkSessionModal";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";

type QuickManualWorkSessionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: IProject[];
  defaultYear: number;
  defaultMonth: number;
  defaultDay?: number;
  onSaved: () => void;
};

export function QuickManualWorkSessionModal({
  open,
  onOpenChange,
  projects,
  defaultYear,
  defaultMonth,
  defaultDay,
  onSaved,
}: QuickManualWorkSessionModalProps) {
  const { t } = useTranslation();
  const [projectId, setProjectId] = useState<string | null>(null);

  if (projectId) {
    return (
      <ManualWorkSessionModal
        open={open}
        onOpenChange={(next) => {
          if (!next) setProjectId(null);
          onOpenChange(next);
        }}
        projectId={projectId}
        defaultYear={defaultYear}
        defaultMonth={defaultMonth}
        defaultDay={defaultDay}
        onSaved={() => {
          setProjectId(null);
          onSaved();
        }}
      />
    );
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <AppModalHeader>{t("auto.k874bd0048a")}</AppModalHeader>
        <div className="space-y-2 p-4">
          <p className="text-sm text-muted">{t("auto.k723423f3e7")}</p>
          {projects.length === 0 ? (
            <p className="text-sm text-muted">{t("auto.k4f4cb60647")}</p>
          ) : (
            projects.map((project) => (
              <Button
                key={project._id}
                variant="secondary"
                className="w-full justify-start"
                onPress={() => setProjectId(project._id)}
              >
                {project.category?.title ?? t("auto.kcce7e8ff41")}
              </Button>
            ))
          )}
        </div>
      </AppModalDialog>
    </AppModal>
  );
}
