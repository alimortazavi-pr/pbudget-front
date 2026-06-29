"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";

import * as businessApi from "@/common/api/business";
import type { IAttendanceTeamMember, ILeaveRequest, IShiftTemplate } from "@/common/interfaces/business.interface";
import {
  LEAVE_TYPE_LABELS,
  REQUEST_STATUS_LABELS,
  minuteToTimeLabel,
} from "@/common/utils/business-attendance";
import { showToast } from "@/common/utils/toast";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

type BusinessAttendanceTeamPageProps = {
  businessId: string;
};

export function BusinessAttendanceTeamPage({
  businessId,
}: BusinessAttendanceTeamPageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const [team, setTeam] = useState<IAttendanceTeamMember[]>([]);
  const [requests, setRequests] = useState<ILeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamData, reqData] = await Promise.all([
        businessApi.fetchBusinessTeamAttendance(businessId),
        businessApi.fetchBusinessLeaveRequests(businessId),
      ]);
      setTeam((teamData as { team: IAttendanceTeamMember[] }).team ?? []);
      setRequests(reqData);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(requestId: string, status: "approved" | "rejected") {
    try {
      await businessApi.reviewBusinessLeaveRequest(
        requestId,
        { status },
        businessId,
      );
      showToast(status === "approved" ? "تأیید شد" : "رد شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  if (!hasBusinessPermission(permissions, "attendance.view_team")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی مشاهده تیم ندارید
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-muted">در حال بارگذاری…</div>;
  }

  return (
    <div className="space-y-5">
      <section className="glass rounded-2xl p-4">
        <h2 className="font-semibold">وضعیت امروز</h2>
        <ul className="mt-3 space-y-2">
          {team.map((m) => (
            <li
              key={m.memberId}
              className="flex items-center justify-between rounded-xl bg-surface-secondary px-3 py-2 text-sm"
            >
              <span>{m.displayName}</span>
              <span
                className={
                  m.status === "present"
                    ? "text-emerald-600"
                    : m.status === "left"
                      ? "text-amber-600"
                      : "text-muted"
                }
              >
                {m.status === "present"
                  ? "حاضر"
                  : m.status === "left"
                    ? "خروج"
                    : "غایب"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {hasBusinessPermission(permissions, "attendance.approve_requests") ? (
        <section className="glass rounded-2xl p-4">
          <h2 className="font-semibold">درخواست‌های در انتظار</h2>
          {requests.filter((r) => r.status === "pending").length === 0 ? (
            <p className="mt-2 text-sm text-muted">درخواستی نیست</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {requests
                .filter((r) => r.status === "pending")
                .map((r) => (
                  <li
                    key={r._id}
                    className="rounded-xl border border-border p-3 text-sm"
                  >
                    <p className="font-medium">
                      {r.member?.displayName ?? "کارمند"} —{" "}
                      {LEAVE_TYPE_LABELS[r.type] ?? r.type}
                    </p>
                    <p className="text-muted">
                      {r.year}/{r.month}/{r.day}
                      {r.type === "hourly"
                        ? ` · ${minuteToTimeLabel(r.startMinute ?? 0)} – ${minuteToTimeLabel(r.endMinute ?? 0)}`
                        : ""}
                      {r.type === "manual_attendance"
                        ? ` · ${r.manualEventType === "clock_out" ? "خروج" : "ورود"}`
                        : ""}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        onPress={() => void review(r._id, "approved")}
                      >
                        تأیید
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => void review(r._id, "rejected")}
                      >
                        رد
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
