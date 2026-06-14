"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal, Switch } from "@heroui/react";

import * as projectsApi from "@/common/api/projects";
import * as tasksApi from "@/common/api/tasks";
import type { IProject } from "@/common/interfaces/project.interface";
import type { ITaskRoutine, TaskPriority } from "@/common/interfaces/task.interface";
import { JALALI_WEEKDAYS_SHORT, toEnglishDigits, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import {
  FormInput,
  FormSelect,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { AppModal } from "@/components/common/ui/AppModal";

const PRIORITY_OPTIONS = [
  { id: "low", label: "کم" },
  { id: "medium", label: "متوسط" },
  { id: "high", label: "زیاد" },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  id: String(hour),
  label: toPersianDigits(`${String(hour).padStart(2, "0")}:00`),
}));

type CreateRoutineModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine?: ITaskRoutine | null;
  onSaved: (routine: ITaskRoutine) => void;
};

export function CreateRoutineModal({
  open,
  onOpenChange,
  routine,
  onSaved,
}: CreateRoutineModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [everyDay, setEveryDay] = useState(true);
  const [active, setActive] = useState(true);
  const [remindTelegram, setRemindTelegram] = useState(true);
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<IProject[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(routine?.title ?? "");
    setDescription(routine?.description ?? "");
    setPriority(routine?.priority ?? "medium");
    setStartHour(
      routine?.startHour !== undefined ? String(routine.startHour) : "",
    );
    setEndHour(routine?.endHour !== undefined ? String(routine.endHour) : "");
    const days = routine?.weekdays ?? [];
    setWeekdays(days);
    setEveryDay(!days.length);
    setActive(routine?.active ?? true);
    setRemindTelegram(routine?.remindTelegram ?? true);
    setProjectId(
      routine?.project && typeof routine.project === "object"
        ? routine.project._id
        : "",
    );
    void projectsApi.fetchProjects().then(setProjects).catch(() => undefined);
  }, [open, routine]);

  const projectOptions = useMemo(
    () => [
      { id: "none", label: "بدون پروژه" },
      ...projects.map((p) => ({
        id: p._id,
        label: p.category?.title ?? "پروژه",
      })),
    ],
    [projects],
  );

  function toggleWeekday(day: number) {
    setEveryDay(false);
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort(),
    );
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      showToast("عنوان الزامی است");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      projectId: projectId && projectId !== "none" ? projectId : null,
      startHour: startHour ? parseInt(toEnglishDigits(startHour), 10) : undefined,
      endHour: endHour ? parseInt(toEnglishDigits(endHour), 10) : undefined,
      weekdays: everyDay ? [] : weekdays,
      active,
      remindTelegram,
    };

    if (
      (payload.startHour !== undefined && payload.endHour === undefined) ||
      (payload.endHour !== undefined && payload.startHour === undefined)
    ) {
      showToast("ساعت شروع و پایان را با هم وارد کنید");
      return;
    }

    setSaving(true);
    try {
      const saved = routine
        ? await tasksApi.updateTaskRoutine(routine._id, payload)
        : await tasksApi.createTaskRoutine(payload);
      showToast(routine ? "ذخیره شد" : "تسک ثابت ایجاد شد", "success");
      onSaved(saved);
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog>
        <form onSubmit={(e) => void save(e)}>
          <Modal.Header>
            <Modal.Heading>
              {routine ? "ویرایش تسک ثابت" : "تسک ثابت جدید"}
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            <p className="text-sm leading-7 text-muted">
              تسک‌های ثابت هر روز (یا روزهای انتخابی) خودکار به برنامه روزانه اضافه
              می‌شوند.
            </p>
            <FormInput
              label="عنوان"
              placeholder="مثلاً رفتن سرکار"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <FormTextArea
              label="توضیحات"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormSelect
                label="از ساعت"
                placeholder="—"
                selectedKey={startHour || undefined}
                onSelectionChange={(key) => setStartHour(key)}
                options={HOUR_OPTIONS}
              />
              <FormSelect
                label="تا ساعت"
                placeholder="—"
                selectedKey={endHour || undefined}
                onSelectionChange={(key) => setEndHour(key)}
                options={HOUR_OPTIONS}
              />
            </div>
            <FormSelect
              label="اولویت"
              selectedKey={priority}
              onSelectionChange={(key) => setPriority(key as TaskPriority)}
              options={PRIORITY_OPTIONS}
            />
            <FormSelect
              label="پروژه مرتبط"
              selectedKey={projectId || "none"}
              onSelectionChange={(key) => setProjectId(key === "none" ? "" : key)}
              options={projectOptions}
            />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">روزهای تکرار</p>
                <label className="flex items-center gap-2 text-xs text-muted">
                  <Switch
                    isSelected={everyDay}
                    onChange={(value) => {
                      setEveryDay(value);
                      if (value) setWeekdays([]);
                    }}
                    size="sm"
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                  هر روز
                </label>
              </div>
              {!everyDay && (
                <div className="flex flex-wrap gap-2">
                  {JALALI_WEEKDAYS_SHORT.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleWeekday(index)}
                      className={`size-10 cursor-pointer rounded-xl text-sm font-semibold transition ${
                        weekdays.includes(index)
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-secondary text-muted"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3 rounded-xl border border-border/50 bg-surface-secondary p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">فعال</p>
                  <p className="text-xs text-muted">غیرفعال = دیگر اضافه نمی‌شود</p>
                </div>
                <Switch isSelected={active} onChange={setActive} size="sm">
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">یادآوری تلگرام</p>
                  <p className="text-xs text-muted">صبح در بات ارسال می‌شود</p>
                </div>
                <Switch
                  isSelected={remindTelegram}
                  onChange={setRemindTelegram}
                  size="sm"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" isPending={saving}>
              ذخیره
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Dialog>
    </AppModal>
  );
}
