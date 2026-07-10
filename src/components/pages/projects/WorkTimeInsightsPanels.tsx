"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { Button } from "@heroui/react";

import { PATHS } from "@/common/constants";
import type {
  IWorkTimeAlert,
  IWorkTimeInsight,
} from "@/common/interfaces/work-time.interface";

const alertClass: Record<IWorkTimeAlert["severity"], string> = {
  high: "border-danger/40 bg-danger/10 text-danger",
  medium: "border-warning/40 bg-warning/10 text-warning-foreground",
  low: "border-accent/30 bg-accent/10 text-accent",
};

const insightClass: Record<IWorkTimeInsight["type"], string> = {
  warning: "border-warning/40 bg-warning/10",
  info: "border-accent/30 bg-accent/5",
  success: "border-income/40 bg-income-soft/40",
};

function alertActionLabel(action: IWorkTimeAlert["action"]) {
  if (action === "clock-out") return "ثبت خروج";
  if (action === "open-project") return "حضور و غیاب پروژه";
  if (action === "set-target") return "تعریف ساعت موظف";
  return "مشاهده حضور و غیاب";
}

function attendanceHref(alert: IWorkTimeAlert) {
  if (alert.projectId) return PATHS.PROJECT_ATTENDANCE(alert.projectId);
  return PATHS.WORK_ATTENDANCE;
}

type WorkTimeInsightsPanelsProps = {
  alerts: IWorkTimeAlert[];
  insights: IWorkTimeInsight[];
  onAlertAction?: (alert: IWorkTimeAlert) => void;
};

export function WorkTimeInsightsPanels({
  alerts,
  insights,
  onAlertAction,
}: WorkTimeInsightsPanelsProps) {
  const { t } = useTranslation();
  if (!alerts.length && !insights.length) return null;

  return (
    <div className="space-y-4">
      {alerts.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted">{t("هشدارها")}</h3>
          {alerts.map((alert) => (
            <article
              key={alert.id}
              className={`rounded-2xl border px-4 py-3 text-sm ${alertClass[alert.severity]}`}
            >
              <p className="font-semibold">{alert.title}</p>
              <p className="mt-1 leading-6 opacity-90">{alert.message}</p>
              {alert.action === "open-project" && alert.projectId ? (
                <Link href={attendanceHref(alert)} className="mt-2 inline-block">
                  <Button size="sm" variant="secondary">
                    {alertActionLabel(alert.action)}
                  </Button>
                </Link>
              ) : alert.action === "view-attendance" ? (
                <Link href={attendanceHref(alert)} className="mt-2 inline-block">
                  <Button size="sm" variant="secondary">
                    {alertActionLabel(alert.action)}
                  </Button>
                </Link>
              ) : alert.action && onAlertAction ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onPress={() => onAlertAction(alert)}
                >
                  {alertActionLabel(alert.action)}
                </Button>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {insights.length > 0 ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-muted">{t("بینش‌های کارکرد")}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {insights.map((insight, index) => (
              <article
                key={`${insight.title}-${index}`}
                className={`rounded-2xl border p-4 text-sm ${insightClass[insight.type]}`}
              >
                <p className="font-semibold">{insight.title}</p>
                <p className="mt-1 leading-6 text-muted">{insight.message}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
