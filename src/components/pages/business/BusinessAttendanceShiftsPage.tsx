"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Label } from "@heroui/react";
import { Add, Trash } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import type { IShiftTemplate } from "@/common/interfaces/business.interface";
import {
  WEEKDAY_LABELS,
  minuteToTimeLabel,
} from "@/common/utils/business-attendance";
import { showToast } from "@/common/utils/toast";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type BusinessAttendanceShiftsPageProps = {
  businessId: string;
};

const MODE_LABELS: Record<string, string> = {
  fixed: "ثابت (اداری)",
  hourly: "ساعتی (پاره‌وقت)",
  flexible: "شناور",
  rotating: "چرخشی (ساعت متفاوت هر روز)",
};

export function BusinessAttendanceShiftsPage({
  businessId,
}: BusinessAttendanceShiftsPageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const [templates, setTemplates] = useState<IShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("fixed");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [minHours, setMinHours] = useState("4");
  const [remoteWork, setRemoteWork] = useState(false);
  const [observeHolidays, setObserveHolidays] = useState(true);
  const [workDays, setWorkDays] = useState<number[]>([0, 1, 2, 3, 4]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await businessApi.fetchBusinessShiftTemplates(businessId);
      setTemplates(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  function parseTime(value: string) {
    const [h, m] = value.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  function toggleDay(day: number) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  }

  async function create() {
    if (!title.trim()) {
      showToast("نام شیفت الزامی است");
      return;
    }
    try {
      await businessApi.createBusinessShiftTemplate(
        {
          title: title.trim(),
          mode,
          workDays,
          startMinute: parseTime(startTime),
          endMinute: parseTime(endTime),
          minMinutesPerDay: Number(minHours) * 60,
          remoteWorkAllowed: remoteWork,
          observeOfficialHolidays: observeHolidays,
          rotatingSchedule:
            mode === "rotating"
              ? workDays.map((weekday) => ({
                  weekday,
                  startMinute: parseTime(startTime),
                  endMinute: parseTime(endTime),
                }))
              : [],
        },
        businessId,
      );
      showToast("شیفت ایجاد شد", "success");
      setTitle("");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function remove(id: string) {
    if (!confirm("این شیفت حذف شود؟")) return;
    try {
      await businessApi.deleteBusinessShiftTemplate(id, businessId);
      showToast("حذف شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  if (!hasBusinessPermission(permissions, "attendance.manage_shifts")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی مدیریت شیفت ندارید
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold">تعریف شیفت جدید</h2>
        <div>
          <Label className="mb-1 block text-sm">نام شیفت</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MODE_LABELS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${
                mode === key
                  ? "bg-violet-600 text-white"
                  : "bg-surface-secondary text-muted"
              }`}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div>
          <Label className="mb-2 block text-sm">روزهای کاری</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAY_LABELS.map((label, idx) => (
              <button
                key={label}
                type="button"
                className={`rounded-full px-2 py-1 text-xs ${
                  workDays.includes(idx)
                    ? "bg-violet-600 text-white"
                    : "bg-surface-secondary text-muted"
                }`}
                onClick={() => toggleDay(idx)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {mode === "hourly" ? (
          <div>
            <Label className="mb-1 block text-sm">حداقل ساعت روزانه</Label>
            <Input
              type="number"
              value={minHours}
              onChange={(e) => setMinHours(e.target.value)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-sm">شروع</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm">پایان</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={remoteWork}
            onChange={(e) => setRemoteWork(e.target.checked)}
          />
          امکان دورکاری
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={observeHolidays}
            onChange={(e) => setObserveHolidays(e.target.checked)}
          />
          رعایت جمعه و تعطیلات رسمی ایران
        </label>
        <Button className="w-full" onPress={() => void create()}>
          <Add size={18} />
          ذخیره شیفت
        </Button>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="font-semibold">شیفت‌های تعریف‌شده</h2>
        {loading ? (
          <p className="mt-2 text-sm text-muted">در حال بارگذاری…</p>
        ) : templates.length === 0 ? (
          <p className="mt-2 text-sm text-muted">شیفتی تعریف نشده</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {templates.map((t) => (
              <li
                key={t._id}
                className="flex items-start justify-between rounded-xl border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-muted">
                    {MODE_LABELS[t.mode] ?? t.mode}
                    {t.mode === "hourly"
                      ? ` · حداقل ${Math.floor(t.minMinutesPerDay / 60)} ساعت`
                      : ` · ${minuteToTimeLabel(t.startMinute)} – ${minuteToTimeLabel(t.endMinute)}`}
                  </p>
                  {t.remoteWorkAllowed ? (
                    <span className="text-xs text-violet-600">دورکاری</span>
                  ) : null}
                </div>
                <Button
                  isIconOnly
                  variant="ghost"
                  aria-label="حذف"
                  onPress={() => void remove(t._id)}
                >
                  <Trash size={18} />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
