"use client";

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
        <AppModalHeader>ثبت دستی ساعت</AppModalHeader>
        <div className="space-y-2 p-4">
          <p className="text-sm text-muted">پروژه را انتخاب کنید:</p>
          {projects.length === 0 ? (
            <p className="text-sm text-muted">پروژه‌ای با ثبت ساعت فعال نیست.</p>
          ) : (
            projects.map((project) => (
              <Button
                key={project._id}
                variant="secondary"
                className="w-full justify-start"
                onPress={() => setProjectId(project._id)}
              >
                {project.category?.title ?? "پروژه"}
              </Button>
            ))
          )}
        </div>
      </AppModalDialog>
    </AppModal>
  );
}
