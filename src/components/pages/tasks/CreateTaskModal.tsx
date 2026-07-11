"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as tasksApi from "@/common/api/tasks";
import * as projectsApi from "@/common/api/projects";
import type { IProject } from "@/common/interfaces/project.interface";
import type { ITask, TaskPriority } from "@/common/interfaces/task.interface";
import { showToast } from "@/common/utils/toast";
import { toEnglishDigits } from "@/common/utils";
import {
  FormInput,
  FormSelect,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";

type CreateTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultYear: string;
  defaultMonth: string;
  defaultDay: string;
  defaultProjectId?: string;
  task?: ITask | null;
  onSaved: (task: ITask) => void;
};

const PRIORITY_OPTIONS = [
  { id: "low", label: t("auto.k38b171ab8b") },
  { id: "medium", label: t("auto.k1418425392") },
  { id: "high", label: t("auto.k81e4de6a04") },
];

export function CreateTaskModal({
  open,
  onOpenChange,
  defaultYear,
  defaultMonth,
  defaultDay,
  defaultProjectId,
  task,
  onSaved,
}: CreateTaskModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState(defaultDay);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<IProject[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setYear(String(task?.dueYear ?? defaultYear));
    setMonth(String(task?.dueMonth ?? defaultMonth));
    setDay(String(task?.dueDay ?? defaultDay));
    setProjectId(
      task?.project && typeof task.project === "object"
        ? task.project._id
        : defaultProjectId ?? "",
    );
    void projectsApi.fetchProjects().then(setProjects).catch(() => undefined);
  }, [open, task, defaultYear, defaultMonth, defaultDay, defaultProjectId]);

  const projectOptions = useMemo(
    () => [
      { id: "none", label: t("auto.kdeafaa63f0") },
      ...projects.map((p) => ({
        id: p._id,
        label: p.category?.title ?? t("auto.kcce7e8ff41"),
      })),
    ],
    [projects],
  );

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      showToast(t("auto.k327497d9aa"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueYear: toEnglishDigits(year),
        dueMonth: toEnglishDigits(month),
        dueDay: toEnglishDigits(day),
        projectId: projectId && projectId !== "none" ? projectId : null,
      };

      const saved = task
        ? await tasksApi.updateTask(task._id, payload)
        : await tasksApi.createTask(payload);

      showToast(task ? t("auto.k6d8364cd9e") : t("auto.k954f062479"), "success");
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <form onSubmit={(e) => void save(e)}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{task ? t("auto.k32d20898e1") : t("auto.k4e2c618bad")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <FormInput
              label={t("common.title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <FormTextArea
              label={t("common.description")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <FormSelect
              label={t("auto.k44e7afcf53")}
              selectedKey={priority}
              onSelectionChange={(key) => setPriority(key as TaskPriority)}
              options={PRIORITY_OPTIONS}
            />
            <div>
              <p className="mb-2 text-sm text-muted">{t("auto.kead5f7b71e")}</p>
              <FilterDatePicker
                year={year}
                month={month}
                day={day}
                inModal
                onChange={({ year: y, month: m, day: d }) => {
                  setYear(y);
                  setMonth(m);
                  setDay(d);
                }}
              />
            </div>
            <FormSelect
              label={t("auto.ke1b21454fe")}
              placeholder={t("auto.kdeafaa63f0")}
              selectedKey={projectId || "none"}
              onSelectionChange={(key) => setProjectId(key === "none" ? "" : key)}
              options={projectOptions}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving}>
              {t("common.save")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
