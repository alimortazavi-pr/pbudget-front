"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Input, Label, Switch, TextField } from "@heroui/react";
import { Add, Edit2, Task, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import * as tasksApi from "@/common/api/tasks";
import * as projectsApi from "@/common/api/projects";
import type { IProject } from "@/common/interfaces/project.interface";
import type {
  ITask,
  ITaskSummary,
  TaskDuration,
  TaskStatusFilter,
} from "@/common/interfaces/task.interface";
import {
  formatCount,
  formatHourRange,
  formatJalaliDate,
  formatJalaliMonthYear,
  formatJalaliYear,
  getJalaliNow,
} from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormSelect } from "@/components/common/form/FormFields";
import { PeriodNavigator } from "@/components/pages/planning/PeriodNavigator";
import { usePeriodQuery } from "@/components/pages/planning/usePeriodQuery";
import { CreateTaskModal } from "@/components/pages/tasks/CreateTaskModal";
import { TaskRoutinesSection } from "@/components/pages/tasks/TaskRoutinesSection";

function priorityLabel(priority: ITask["priority"]) {
  if (priority === "high") return "زیاد";
  if (priority === "low") return "کم";
  return "متوسط";
}

function priorityClass(priority: ITask["priority"]) {
  if (priority === "high") return "bg-rose-500/15 text-rose-600";
  if (priority === "low") return "bg-surface-secondary text-muted";
  return "bg-accent/15 text-accent";
}

function isOverdue(task: ITask) {
  if (task.done) return false;
  const now = getJalaliNow();
  const y = now.jYear();
  const m = now.jMonth() + 1;
  const d = now.jDate();
  return (
    task.dueYear < y ||
    (task.dueYear === y && task.dueMonth < m) ||
    (task.dueYear === y && task.dueMonth === m && task.dueDay < d)
  );
}

function getProjectTitle(task: ITask) {
  if (!task.project || typeof task.project === "string") return null;
  return task.project.category?.title ?? null;
}

export function TasksPage() {
  const { get } = useHydratedSearchParams();
  const {
    year,
    month,
    day,
    updateQuery,
    goToToday,
    shiftDay,
    shiftMonth,
    shiftYear,
  } = usePeriodQuery(PATHS.TASKS);

  const duration = (get("duration", "daily") as TaskDuration);
  const section = get("section") === "routines" ? "routines" : "schedule";
  const projectFilter = get("projectId", "");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [summary, setSummary] = useState<ITaskSummary | null>(null);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<ITask | null>(null);

  const periodLabel = useMemo(() => {
    if (duration === "yearly") return formatJalaliYear(year);
    if (duration === "monthly") return formatJalaliMonthYear(year, month);
    return formatJalaliDate(year, month, day);
  }, [duration, year, month, day]);

  const listParams = useMemo(
    () => ({
      duration,
      year,
      month: duration !== "yearly" ? month : undefined,
      day: duration === "daily" ? day : undefined,
      status: statusFilter,
      projectId: projectFilter || undefined,
    }),
    [duration, year, month, day, statusFilter, projectFilter],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [taskList, taskSummary, projectList] = await Promise.all([
        tasksApi.fetchTasks(listParams),
        tasksApi.fetchTaskSummary(listParams),
        projectsApi.fetchProjects(),
      ]);
      setTasks(taskList);
      setSummary(taskSummary);
      setProjects(projectList);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [listParams]);

  useEffect(() => {
    void load();
  }, [load]);

  const projectOptions = useMemo(
    () => [
      { id: "all", label: "همه پروژه‌ها" },
      ...projects.map((p) => ({
        id: p._id,
        label: p.category?.title ?? "پروژه",
      })),
    ],
    [projects],
  );

  function handlePeriodPrev() {
    if (duration === "daily") shiftDay(-1);
    else if (duration === "yearly") shiftYear(-1);
    else shiftMonth(-1);
  }

  function handlePeriodNext() {
    if (duration === "daily") shiftDay(1);
    else if (duration === "yearly") shiftYear(1);
    else shiftMonth(1);
  }

  async function quickAdd(e?: FormEvent) {
    e?.preventDefault();
    if (!quickTitle.trim()) return;

    setQuickSaving(true);
    try {
      const task = await tasksApi.createTask({
        title: quickTitle.trim(),
        dueYear: year,
        dueMonth: month,
        dueDay: day,
        projectId: projectFilter || null,
      });
      setQuickTitle("");
      setTasks((current) => [task, ...current]);
      setSummary((current) =>
        current
          ? { ...current, total: current.total + 1, pending: current.pending + 1 }
          : current,
      );
      showToast("تسک اضافه شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setQuickSaving(false);
    }
  }

  async function toggleTask(task: ITask) {
    try {
      const updated = await tasksApi.toggleTask(task._id);
      setTasks((current) =>
        current.map((row) => (row._id === task._id ? updated : row)),
      );
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function removeTask(task: ITask) {
    try {
      await tasksApi.deleteTask(task._id);
      setTasks((current) => current.filter((row) => row._id !== task._id));
      void load();
      showToast("حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  function openCreate() {
    setEditTask(null);
    setModalOpen(true);
  }

  function openEdit(task: ITask) {
    setEditTask(task);
    setModalOpen(true);
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white/80">برنامه‌ریزی و پیگیری</p>
            <h1 className="mt-1 text-2xl font-bold">برنامه روزانه</h1>
            <p className="mt-2 text-sm leading-7 text-white/80">
              برنامه روزانه، ماهانه و سالانه — همه با تاریخ شمسی و لینک به پروژه‌ها
            </p>
          </div>
          <Task size={36} variant="Bold" className="shrink-0 opacity-90" />
        </div>
      </section>

      <div className="mb-4 flex gap-2">
        {(
          [
            { id: "schedule" as const, label: "لیست برنامه" },
            { id: "routines" as const, label: "تسک‌های ثابت" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => updateQuery({ section: item.id === "schedule" ? "" : item.id })}
            className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              section === item.id
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "routines" ? (
        <TaskRoutinesSection />
      ) : (
        <>
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { id: "daily" as const, label: "روزانه" },
            { id: "monthly" as const, label: "ماهانه" },
            { id: "yearly" as const, label: "سالانه" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => updateQuery({ duration: item.id })}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition ${
              duration === item.id
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <PeriodNavigator
        label={periodLabel}
        onPrev={handlePeriodPrev}
        onNext={handlePeriodNext}
        onToday={goToToday}
      />

      {summary && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass rounded-2xl p-3 text-center">
            <p className="text-xs text-muted">کل</p>
            <p className="mt-1 text-xl font-bold">{formatCount(summary.total)}</p>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <p className="text-xs text-muted">انجام‌شده</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">{formatCount(summary.done)}</p>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <p className="text-xs text-muted">باز</p>
            <p className="mt-1 text-xl font-bold text-accent">{formatCount(summary.pending)}</p>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <p className="text-xs text-muted">عقب‌افتاده</p>
            <p className="mt-1 text-xl font-bold text-rose-600">{formatCount(summary.overdue)}</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <FormSelect
            label="فیلتر پروژه"
            selectedKey={projectFilter || "all"}
            onSelectionChange={(key) =>
              updateQuery({ projectId: key === "all" ? "" : key })
            }
            options={projectOptions}
          />
        </div>
        <div className="flex gap-2">
          {(
            [
              { id: "all" as const, label: "همه" },
              { id: "open" as const, label: "باز" },
              { id: "done" as const, label: "انجام‌شده" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatusFilter(item.id)}
              className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium ${
                statusFilter === item.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-secondary text-muted"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {duration === "daily" && (
        <form
          onSubmit={(e) => void quickAdd(e)}
          className="glass mt-4 rounded-2xl p-3"
        >
          <TextField className="gap-2">
            <Label>تسک سریع</Label>
            <div className="flex items-center gap-2">
              <Input
                variant="secondary"
                className="min-w-0 flex-1"
                placeholder="تسک امروز را بنویسید…"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
              />
              <Button type="submit" isPending={quickSaving} className="shrink-0">
                <Add size={18} />
                افزودن
              </Button>
            </div>
          </TextField>
        </form>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onPress={openCreate}>
          <Add size={18} />
          تسک با جزئیات
        </Button>
      </div>

      {loading ? (
        <div className="glass mt-4 rounded-2xl p-10 text-center text-muted">
          در حال بارگذاری…
        </div>
      ) : tasks.length === 0 ? (
        <div className="glass mt-4 rounded-2xl p-10 text-center">
          <Task size={40} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">تسکی برای این بازه نیست</p>
          <Button className="mt-4" onPress={openCreate}>
            اولین تسک
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {tasks.map((task) => {
            const projectTitle = getProjectTitle(task);
            const overdue = isOverdue(task);

            return (
              <article
                key={task._id}
                className={`glass flex items-start gap-3 rounded-2xl p-4 ${
                  overdue ? "border border-rose-500/40" : ""
                }`}
              >
                <Switch
                  isSelected={task.done}
                  onChange={() => void toggleTask(task)}
                  size="sm"
                  aria-label="انجام شد"
                >
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`font-medium ${
                        task.done ? "text-muted line-through" : ""
                      }`}
                    >
                      {task.title}
                    </p>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${priorityClass(task.priority)}`}
                    >
                      {priorityLabel(task.priority)}
                    </span>
                    {overdue && (
                      <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                        عقب‌افتاده
                      </span>
                    )}
                  </div>

                  {task.description ? (
                    <p className="mt-1 text-sm text-muted">{task.description}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                    {duration !== "daily" && (
                      <span>
                        {formatJalaliDate(
                          String(task.dueYear),
                          String(task.dueMonth),
                          String(task.dueDay),
                        )}
                      </span>
                    )}
                    {formatHourRange(task.startHour, task.endHour) && (
                      <span className="font-medium text-accent">
                        {formatHourRange(task.startHour, task.endHour)}
                      </span>
                    )}
                    {task.routine && (
                      <span className="rounded-md bg-surface-secondary px-2 py-0.5">
                        ثابت
                      </span>
                    )}
                    {projectTitle && (
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-accent">
                        {projectTitle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => openEdit(task)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    onPress={() => void removeTask(task)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <CreateTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultYear={year}
        defaultMonth={month}
        defaultDay={day}
        defaultProjectId={projectFilter || undefined}
        task={editTask}
        onSaved={(saved) => {
          setTasks((current) => {
            const exists = current.some((row) => row._id === saved._id);
            if (exists) {
              return current.map((row) => (row._id === saved._id ? saved : row));
            }
            return [saved, ...current];
          });
          void load();
        }}
      />
        </>
      )}
    </div>
  );
}
