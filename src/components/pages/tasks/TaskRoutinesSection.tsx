"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Add, Edit2, Refresh, Trash } from "iconsax-reactjs";

import * as tasksApi from "@/common/api/tasks";
import type { ITaskRoutine } from "@/common/interfaces/task.interface";
import {
  formatHourRange,
  JALALI_WEEKDAYS_SHORT,
} from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { CreateRoutineModal } from "@/components/pages/tasks/CreateRoutineModal";

function weekdaysLabel(weekdays: number[]) {
  if (!weekdays.length) return "هر روز";
  return weekdays.map((day) => JALALI_WEEKDAYS_SHORT[day]).join("، ");
}

function getProjectTitle(routine: ITaskRoutine) {
  if (!routine.project || typeof routine.project === "string") return null;
  return routine.project.category?.title ?? null;
}

export function TaskRoutinesSection() {
  const { t } = useTranslation();
  const [routines, setRoutines] = useState<ITaskRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRoutine, setEditRoutine] = useState<ITaskRoutine | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await tasksApi.fetchTaskRoutines();
      setRoutines(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeRoutine(routine: ITaskRoutine) {
    try {
      await tasksApi.deleteTaskRoutine(routine._id);
      setRoutines((current) => current.filter((row) => row._id !== routine._id));
      showToast(t("حذف شد"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-accent/15 p-2 text-accent">
            <Refresh size={22} variant="Bold" />
          </div>
          <div>
            <h2 className="font-bold">{t("تسک‌های ثابت")}</h2>
            <p className="mt-1 text-sm leading-7 text-muted">
              مثل «رفتن سرکار ۱۰ تا ۱۶» — یک‌بار تعریف کن، هر روز خودکار به لیست
              روزانه اضافه می‌شود. یادآوری صبح هم از تلگرام می‌آید (اگر وصل باشی).
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onPress={() => {
            setEditRoutine(null);
            setModalOpen(true);
          }}
        >
          <Add size={18} />
          تسک ثابت جدید
        </Button>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          در حال بارگذاری…
        </div>
      ) : routines.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          هنوز تسک ثابتی تعریف نشده
        </div>
      ) : (
        <div className="space-y-2">
          {routines.map((routine) => {
            const time = formatHourRange(routine.startHour, routine.endHour);
            const projectTitle = getProjectTitle(routine);

            return (
              <article key={routine._id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{routine.title}</h3>
                      {!routine.active && (
                        <span className="rounded-md bg-surface-secondary px-2 py-0.5 text-[10px] text-muted">
                          غیرفعال
                        </span>
                      )}
                    </div>
                    {routine.description ? (
                      <p className="mt-1 text-sm text-muted">{routine.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                      <span>{weekdaysLabel(routine.weekdays)}</span>
                      {time && <span>· {time}</span>}
                      {projectTitle && (
                        <span className="text-accent">· {projectTitle}</span>
                      )}
                      {routine.remindTelegram && <span>{t("· یادآور تلگرام")}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => {
                        setEditRoutine(routine);
                        setModalOpen(true);
                      }}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onPress={() => void removeRoutine(routine)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CreateRoutineModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        routine={editRoutine}
        onSaved={(saved) => {
          setRoutines((current) => {
            const exists = current.some((row) => row._id === saved._id);
            if (exists) {
              return current.map((row) => (row._id === saved._id ? saved : row));
            }
            return [saved, ...current];
          });
        }}
      />
    </div>
  );
}
