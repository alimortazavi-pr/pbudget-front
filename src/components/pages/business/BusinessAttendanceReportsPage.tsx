"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Label } from "@heroui/react";
import { DocumentDownload, Edit2, Trash } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import { getJalaliNow } from "@/common/utils/jalali-date";
import {
  formatDurationMinutes,
  getJalaliDaysInMonth,
  isFriday,
  isOfficialHoliday,
  isWorkingDay,
  JALALI_WEEKDAYS_SHORT,
  toPersianDigits,
} from "@/common/utils";
import {
  minuteToTimeLabel,
  minutesToHoursLabel,
  timeLabelToMinute,
} from "@/common/utils/business-attendance";
import { showToast } from "@/common/utils/toast";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type BusinessAttendanceReportsPageProps = {
  businessId: string;
};

type DayRecord = {
  _id: string;
  eventType: string;
  minuteOfDay: number;
  manual?: boolean;
  note?: string;
};

export function BusinessAttendanceReportsPage({
  businessId,
}: BusinessAttendanceReportsPageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const canTeam = hasBusinessPermission(permissions, "attendance.view_team");
  const canManage = hasBusinessPermission(permissions, "attendance.approve_requests");
  const now = getJalaliNow();
  const [year, setYear] = useState(Number(now.format("jYYYY")));
  const [month, setMonth] = useState(Number(now.format("jM")));
  const [memberId, setMemberId] = useState(workspace?.memberId ?? "");
  const [teamReport, setTeamReport] = useState<Awaited<
    ReturnType<typeof businessApi.fetchTeamMonthlyAttendanceReport>
  > | null>(null);
  const [monthlyDetail, setMonthlyDetail] = useState<Awaited<
    ReturnType<typeof businessApi.fetchMonthlyAttendanceReport>
  > | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editEventType, setEditEventType] = useState<"clock_in" | "clock_out">(
    "clock_in",
  );
  const [savingEdit, setSavingEdit] = useState(false);

  const dailyMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const d of monthlyDetail?.report.days ?? []) {
      map.set(d.day, d.workMinutes);
    }
    return map;
  }, [monthlyDetail]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (canTeam) {
        const data = await businessApi.fetchTeamMonthlyAttendanceReport(
          year,
          month,
          businessId,
        );
        setTeamReport(data);
        if (!memberId && data.summaries[0]) {
          setMemberId(data.summaries[0].memberId);
        }
      }
      const targetMember = memberId || workspace?.memberId || undefined;
      const detail = await businessApi.fetchMonthlyAttendanceReport(
        year,
        month,
        targetMember,
        businessId,
      );
      setMonthlyDetail(detail);
      if (!memberId && detail.member.id) {
        setMemberId(detail.member.id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, [businessId, canTeam, memberId, month, workspace?.memberId, year]);

  const loadDay = useCallback(
    async (day: number) => {
      if (!memberId) return;
      try {
        const records = await businessApi.fetchDayAttendanceRecords(
          memberId,
          year,
          month,
          day,
          businessId,
        );
        setDayRecords(records as DayRecord[]);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "خطا");
      }
    },
    [businessId, memberId, month, year],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedDay) void loadDay(selectedDay);
  }, [selectedDay, loadDay]);

  async function removeRecord(id: string) {
    if (!confirm("این تردد حذف شود؟")) return;
    await businessApi.deleteAttendanceRecord(id, businessId);
    showToast("حذف شد", "success");
    if (editingRecordId === id) setEditingRecordId(null);
    if (selectedDay) void loadDay(selectedDay);
    void load();
  }

  function startEdit(record: DayRecord) {
    setEditingRecordId(record._id);
    setEditTime(minuteToTimeLabel(record.minuteOfDay));
    setEditEventType(record.eventType === "clock_out" ? "clock_out" : "clock_in");
  }

  function cancelEdit() {
    setEditingRecordId(null);
    setEditTime("");
    setEditEventType("clock_in");
  }

  async function saveEdit(recordId: string) {
    const minuteOfDay = timeLabelToMinute(editTime);
    if (minuteOfDay === null) {
      showToast("ساعت معتبر نیست (مثلاً ۰۹:۳۰)");
      return;
    }
    setSavingEdit(true);
    try {
      await businessApi.updateAttendanceRecord(
        recordId,
        { minuteOfDay, eventType: editEventType },
        businessId,
      );
      showToast("تردد بروزرسانی شد", "success");
      cancelEdit();
      if (selectedDay) void loadDay(selectedDay);
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await businessApi.exportBusinessAttendanceExcel(
        year,
        month,
        memberId || undefined,
        businessId,
      );
      businessApi.downloadBusinessAttendanceExport(blob, year, month);
      showToast("فایل اکسل دانلود شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در خروجی اکسل");
    } finally {
      setExporting(false);
    }
  }

  if (!hasBusinessPermission(permissions, "attendance.reports")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی گزارش حضور ندارید
      </div>
    );
  }

  const daysInMonth = getJalaliDaysInMonth(year, month);
  const report = monthlyDetail?.report;

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-4">
        <h2 className="font-semibold">
          {canTeam ? "گزارش ماهانه تیم" : "گزارش ماهانه من"}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">سال</Label>
            <Input
              type="number"
              value={String(year)}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
          <div>
            <Label className="text-sm">ماه</Label>
            <Input
              type="number"
              value={String(month)}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
          </div>
        </div>
        {canTeam && teamReport?.summaries.length ? (
          <select
            className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value);
              setSelectedDay(null);
            }}
          >
            {teamReport.summaries.map((s) => (
              <option key={s.memberId} value={s.memberId}>
                {s.displayName}
              </option>
            ))}
          </select>
        ) : null}
        <Button className="mt-3 w-full" variant="secondary" onPress={() => void load()}>
          بروزرسانی
        </Button>
        <Button
          className="mt-2 w-full"
          variant="ghost"
          isDisabled={exporting || loading}
          onPress={() => void handleExport()}
        >
          <DocumentDownload size={18} />
          {exporting ? "در حال آماده‌سازی…" : "خروجی اکسل"}
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-muted">در حال بارگذاری…</p>
      ) : report ? (
        <>
          <div className="glass rounded-2xl p-4 text-sm space-y-1">
            <p>کارکرد: {minutesToHoursLabel(report.totalWorkMinutes)}</p>
            <p className="text-muted">
              موظفی: {minutesToHoursLabel(report.totalExpectedMinutes)}
            </p>
            <p className="text-muted">
              روزهای کاری ماه: {report.workingDaysInMonth ?? "—"} · جمعه:{" "}
              {report.fridayCount ?? 0} · تعطیل رسمی: {report.holidayCount ?? 0}
            </p>
            <p className="text-muted">مرخصی: {report.leaveDays} روز</p>
          </div>

          <section className="glass space-y-3 rounded-2xl p-4">
            <h2 className="font-semibold">تقویم ماه</h2>
            <p className="text-xs text-muted">
              روزهای خط‌خورده: جمعه یا تعطیل رسمی ایران
            </p>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted">
              {JALALI_WEEKDAYS_SHORT.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const minutes = dailyMap.get(day) ?? 0;
                const off = !isWorkingDay(year, month, day);
                const dayInfo = report.days.find((d) => d.day === day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-xl p-2 text-center text-sm ${
                      selectedDay === day
                        ? "bg-violet-600 text-white"
                        : off
                          ? "bg-surface-secondary/60 text-muted line-through"
                          : minutes > 0
                            ? "bg-emerald-500/15"
                            : "bg-surface-secondary"
                    }`}
                    title={
                      off
                        ? isFriday(year, month, day)
                          ? "جمعه"
                          : isOfficialHoliday(year, month, day)
                            ? "تعطیل رسمی"
                            : undefined
                        : dayInfo?.status
                    }
                  >
                    {toPersianDigits(String(day))}
                  </button>
                );
              })}
            </div>
          </section>

          {selectedDay ? (
            <section className="glass rounded-2xl p-4">
              <h3 className="font-semibold">
                ترددهای روز {toPersianDigits(String(selectedDay))}
              </h3>
              {dayRecords.length === 0 ? (
                <p className="mt-2 text-sm text-muted">ترددی نیست</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {dayRecords.map((r) => (
                    <li
                      key={r._id}
                      className="rounded-xl border border-border p-2"
                    >
                      {editingRecordId === r._id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">نوع</Label>
                              <select
                                className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                                value={editEventType}
                                onChange={(e) =>
                                  setEditEventType(
                                    e.target.value as "clock_in" | "clock_out",
                                  )
                                }
                              >
                                <option value="clock_in">ورود</option>
                                <option value="clock_out">خروج</option>
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs">ساعت</Label>
                              <Input
                                type="time"
                                className="mt-1"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              isDisabled={savingEdit}
                              onPress={() => void saveEdit(r._id)}
                            >
                              ذخیره
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-1"
                              isDisabled={savingEdit}
                              onPress={cancelEdit}
                            >
                              انصراف
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span>
                            {r.eventType === "clock_in" ? "ورود" : "خروج"}{" "}
                            {minuteToTimeLabel(r.minuteOfDay)}
                            {r.manual ? " (دستی)" : ""}
                          </span>
                          {canManage ? (
                            <div className="flex gap-1">
                              <Button
                                isIconOnly
                                variant="ghost"
                                size="sm"
                                onPress={() => startEdit(r)}
                              >
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                isIconOnly
                                variant="ghost"
                                size="sm"
                                onPress={() => void removeRecord(r._id)}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {selectedDay && dailyMap.has(selectedDay) ? (
                <p className="mt-2 text-sm text-muted">
                  کارکرد: {formatDurationMinutes(dailyMap.get(selectedDay) ?? 0)}
                </p>
              ) : null}
            </section>
          ) : null}
        </>
      ) : (
        <p className="text-center text-muted">داده‌ای نیست</p>
      )}
    </div>
  );
}
