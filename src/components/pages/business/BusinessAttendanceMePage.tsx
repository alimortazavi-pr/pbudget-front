"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, Label, TextArea } from "@heroui/react";
import { Login, Logout, Location, Calendar, Clock } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import { useGeolocation } from "@/common/hooks/useGeolocation";
import type { ILeaveRequest } from "@/common/interfaces/business.interface";
import { getJalaliNow } from "@/common/utils/jalali-date";
import {
  LEAVE_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  minuteToTimeLabel,
  minutesToHoursLabel,
} from "@/common/utils/business-attendance";
import { AttendancePushReminder } from "@/components/pages/business/AttendancePushReminder";
import { showToast } from "@/common/utils/toast";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type Tab = "clock" | "requests" | "report";

type BusinessAttendanceMePageProps = {
  businessId: string;
};

type AttendanceRecord = {
  eventType: string;
  year: number;
  month: number;
  day: number;
  minuteOfDay: number;
  manual?: boolean;
};

export function BusinessAttendanceMePage({
  businessId,
}: BusinessAttendanceMePageProps) {
  const { position, error: geoError, loading: geoLoading, requestPosition } =
    useGeolocation();
  const [tab, setTab] = useState<Tab>("clock");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [requests, setRequests] = useState<ILeaveRequest[]>([]);
  const [profile, setProfile] = useState<Awaited<
    ReturnType<typeof businessApi.fetchMyAttendanceProfile>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [requestType, setRequestType] = useState<string>("daily");
  const [reason, setReason] = useState("");
  const [startMinute, setStartMinute] = useState("09:00");
  const [endMinute, setEndMinute] = useState("12:00");
  const [manualEvent, setManualEvent] = useState<"clock_in" | "clock_out">(
    "clock_in",
  );
  const [leaveEndYear, setLeaveEndYear] = useState("");
  const [leaveEndMonth, setLeaveEndMonth] = useState("");
  const [leaveEndDay, setLeaveEndDay] = useState("");
  const [reportMonth, setReportMonth] = useState(() => {
    const now = getJalaliNow();
    return { year: Number(now.format("jYYYY")), month: Number(now.format("jM")) };
  });
  const [monthlyReport, setMonthlyReport] = useState<Awaited<
    ReturnType<typeof businessApi.fetchMonthlyAttendanceReport>
  > | null>(null);

  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const geofenceEnabled = Boolean(workspace?.settings?.geofence?.radiusM);
  const canReport = hasBusinessPermission(permissions, "attendance.reports");

  const today = useMemo(() => getJalaliNow(), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [attData, reqData, profileData] = await Promise.all([
        businessApi.fetchMyBusinessAttendance(businessId),
        businessApi.fetchBusinessLeaveRequests(businessId),
        businessApi.fetchMyAttendanceProfile(businessId),
      ]);
      setRecords((attData as { records: AttendanceRecord[] }).records ?? []);
      setRequests(reqData);
      setProfile(profileData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const loadReport = useCallback(async () => {
    if (!canReport) return;
    try {
      const data = await businessApi.fetchMonthlyAttendanceReport(
        reportMonth.year,
        reportMonth.month,
        undefined,
        businessId,
      );
      setMonthlyReport(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }, [businessId, canReport, reportMonth.month, reportMonth.year]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === "report") void loadReport();
  }, [tab, loadReport]);

  function parseTimeToMinute(value: string) {
    const [h, m] = value.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  async function withPosition(
    action: (coords: {
      lat?: number;
      lng?: number;
      remoteWork?: boolean;
    }) => Promise<void>,
    remoteWork = false,
  ) {
    setActing(true);
    try {
      if (remoteWork) {
        await action({ remoteWork: true });
        return;
      }
      const coords = (await requestPosition()) ?? position ?? undefined;
      await action(
        coords ? { lat: coords.lat, lng: coords.lng } : {},
      );
    } finally {
      setActing(false);
    }
  }

  async function clockIn(remoteWork = false) {
    await withPosition(async (coords) => {
      try {
        await businessApi.clockInBusiness(coords, businessId);
        showToast(remoteWork ? "ورود دورکاری ثبت شد" : "ورود ثبت شد", "success");
        void load();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "خطا");
      }
    }, remoteWork);
  }

  async function clockOut(remoteWork = false) {
    await withPosition(async (coords) => {
      try {
        await businessApi.clockOutBusiness(coords, businessId);
        showToast(remoteWork ? "خروج دورکاری ثبت شد" : "خروج ثبت شد", "success");
        void load();
      } catch (err) {
        showToast(err instanceof Error ? err.message : "خطا");
      }
    }, remoteWork);
  }

  async function submitRequest() {
    const y = Number(today.format("jYYYY"));
    const m = Number(today.format("jM"));
    const d = Number(today.format("jD"));

    try {
      await businessApi.createBusinessLeaveRequest(
        {
          type: requestType,
          year: y,
          month: m,
          day: d,
          endYear:
            requestType === "daily" && leaveEndYear
              ? Number(leaveEndYear)
              : undefined,
          endMonth:
            requestType === "daily" && leaveEndMonth
              ? Number(leaveEndMonth)
              : undefined,
          endDay:
            requestType === "daily" && leaveEndDay
              ? Number(leaveEndDay)
              : undefined,
          startMinute: parseTimeToMinute(startMinute),
          endMinute: parseTimeToMinute(endMinute),
          manualEventType: manualEvent,
          reason: reason.trim() || LEAVE_TYPE_LABELS[requestType],
        },
        businessId,
      );
      showToast("درخواست ثبت شد — منتظر تأیید مدیر", "success");
      setReason("");
      void load();
      setTab("requests");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  if (!hasBusinessPermission(permissions, "attendance.self_clock")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی ثبت حضور ندارید
      </div>
    );
  }

  const clockedIn = profile?.today.clockedIn ?? false;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <section className="glass rounded-2xl p-4">
        <p className="text-sm text-muted">شیفت شما</p>
        <p className="text-lg font-semibold">
          {profile?.profileLabel ?? "—"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {profile?.scheduleSummary ?? "در حال بارگذاری…"}
        </p>
        {profile?.remoteWorkAllowed ? (
          <span className="mt-2 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
            دورکاری مجاز
          </span>
        ) : null}
      </section>

      <AttendancePushReminder businessId={businessId} />

      <div className="flex gap-2 rounded-full bg-surface-secondary p-1" data-tour="attendance-tabs">
        {(
          [
            ["clock", "حضور"],
            ["requests", "درخواست‌ها"],
            ...(canReport ? [["report", "گزارش"] as const] : []),
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`flex-1 rounded-full py-2 text-sm ${
              tab === key ? "bg-violet-600 text-white" : "text-muted"
            }`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "clock" ? (
        <>
          <div className="glass rounded-xl p-3 text-sm text-muted">
            <Location size={16} className="inline-block align-middle" />{" "}
            {geoLoading
              ? "در حال دریافت موقعیت…"
              : position
                ? `موقعیت: ${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
                : geoError ?? "برای ثبت حضور، GPS فعال کنید"}
            {geofenceEnabled ? (
              <p className="mt-1 text-xs">
                محدوده مجاز: شعاع {workspace?.settings?.geofence?.radiusM} متر
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3" data-tour="attendance-clock">
            <Button
              size="lg"
              className="h-24 flex-col"
              onPress={() => void clockIn()}
              isPending={acting}
              isDisabled={clockedIn}
            >
              <Login size={28} />
              ثبت ورود
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-24 flex-col"
              onPress={() => void clockOut()}
              isPending={acting}
              isDisabled={!clockedIn}
            >
              <Logout size={28} />
              ثبت خروج
            </Button>
          </div>

          {profile?.remoteWorkAllowed ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                onPress={() => void clockIn(true)}
                isDisabled={clockedIn}
              >
                ورود دورکاری
              </Button>
              <Button
                variant="ghost"
                onPress={() => void clockOut(true)}
                isDisabled={!clockedIn}
              >
                خروج دورکاری
              </Button>
            </div>
          ) : null}

          <section className="glass rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">ثبت درخواست جدید</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(LEAVE_TYPE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs ${
                    requestType === key
                      ? "bg-violet-600 text-white"
                      : "bg-surface-secondary text-muted"
                  }`}
                  onClick={() => setRequestType(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {requestType === "hourly" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>از ساعت</Label>
                  <Input
                    type="time"
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                  />
                </div>
                <div>
                  <Label>تا ساعت</Label>
                  <Input
                    type="time"
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                  />
                </div>
              </div>
            ) : null}

            {requestType === "daily" ? (
              <div className="space-y-2 rounded-xl bg-surface-secondary p-3">
                <p className="text-xs text-muted">
                  شروع: امروز — پایان (اختیاری برای چند روز)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">سال پایان</Label>
                    <Input
                      type="number"
                      placeholder={today.format("jYYYY")}
                      value={leaveEndYear}
                      onChange={(e) => setLeaveEndYear(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">ماه پایان</Label>
                    <Input
                      type="number"
                      placeholder={today.format("jM")}
                      value={leaveEndMonth}
                      onChange={(e) => setLeaveEndMonth(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">روز پایان</Label>
                    <Input
                      type="number"
                      placeholder={today.format("jD")}
                      value={leaveEndDay}
                      onChange={(e) => setLeaveEndDay(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {requestType === "manual_attendance" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={manualEvent === "clock_in" ? "primary" : "ghost"}
                  onPress={() => setManualEvent("clock_in")}
                >
                  ورود دستی
                </Button>
                <Button
                  size="sm"
                  variant={manualEvent === "clock_out" ? "primary" : "ghost"}
                  onPress={() => setManualEvent("clock_out")}
                >
                  خروج دستی
                </Button>
              </div>
            ) : null}

            <div>
              <Label className="mb-1 block text-sm">توضیحات</Label>
              <TextArea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="دلیل درخواست…"
              />
            </div>
            <Button className="w-full" onPress={() => void submitRequest()}>
              ارسال درخواست
            </Button>
          </section>

          <section className="glass rounded-2xl p-4">
            <h2 className="font-semibold">سوابق اخیر</h2>
            {loading ? (
              <p className="mt-2 text-sm text-muted">در حال بارگذاری…</p>
            ) : records.length === 0 ? (
              <p className="mt-2 text-sm text-muted">رکوردی نیست</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {records.map((r, i) => (
                  <li
                    key={i}
                    className="flex justify-between border-b border-border py-2"
                  >
                    <span>
                      {r.eventType === "clock_in" ? "ورود" : "خروج"}
                      {r.manual ? " (دستی)" : ""}
                    </span>
                    <span className="text-muted">
                      {r.year}/{r.month}/{r.day} —{" "}
                      {minuteToTimeLabel(r.minuteOfDay)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}

      {tab === "requests" ? (
        <section className="glass rounded-2xl p-4">
          <h2 className="font-semibold">درخواست‌های من</h2>
          {requests.length === 0 ? (
            <p className="mt-2 text-sm text-muted">درخواستی ثبت نشده</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {requests.map((r) => (
                <li
                  key={r._id}
                  className="rounded-xl border border-border p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {LEAVE_TYPE_LABELS[r.type] ?? r.type}
                    </span>
                    <span
                      className={
                        r.status === "approved"
                          ? "text-emerald-600"
                          : r.status === "rejected"
                            ? "text-rose-600"
                            : "text-amber-600"
                      }
                    >
                      {REQUEST_STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  <p className="mt-1 text-muted">
                    {r.year}/{r.month}/{r.day}
                    {r.type === "hourly"
                      ? ` · ${minuteToTimeLabel(r.startMinute ?? 0)} – ${minuteToTimeLabel(r.endMinute ?? 0)}`
                      : ""}
                  </p>
                  {r.reason ? (
                    <p className="mt-1 text-xs">{r.reason}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === "report" && canReport ? (
        <section className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} />
            <h2 className="font-semibold">گزارش ماهانه</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-sm">سال</Label>
              <Input
                type="number"
                value={String(reportMonth.year)}
                onChange={(e) =>
                  setReportMonth((s) => ({
                    ...s,
                    year: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div>
              <Label className="text-sm">ماه</Label>
              <Input
                type="number"
                value={String(reportMonth.month)}
                onChange={(e) =>
                  setReportMonth((s) => ({
                    ...s,
                    month: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>
          <Button variant="secondary" onPress={() => void loadReport()}>
            بروزرسانی گزارش
          </Button>
          {monthlyReport ? (
            <div className="space-y-2 text-sm">
              <p>
                <Clock size={14} className="inline" /> کارکرد:{" "}
                {minutesToHoursLabel(monthlyReport.report.totalWorkMinutes)}
              </p>
              <p className="text-muted">
                موظفی:{" "}
                {minutesToHoursLabel(
                  monthlyReport.report.totalExpectedMinutes,
                )}
              </p>
              <p className="text-muted">
                مرخصی: {monthlyReport.report.leaveDays} روز
                {monthlyReport.report.leaveMinutes
                  ? ` · ${minutesToHoursLabel(monthlyReport.report.leaveMinutes)}`
                  : ""}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
