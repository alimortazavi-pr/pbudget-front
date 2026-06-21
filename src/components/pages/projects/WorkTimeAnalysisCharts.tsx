"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { IWorkTimeReport } from "@/common/interfaces/work-time.interface";
import {
  formatDurationMinutes,
  formatPrice,
  toPersianDigits,
} from "@/common/utils";

type WorkTimeAnalysisChartsProps = {
  report: IWorkTimeReport;
  scope?: "global" | "project";
};

function DurationTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-accent">{formatDurationMinutes(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

function IncomeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="font-medium">{label}</p>
      <p className="text-income">{formatPrice(payload[0]?.value ?? 0)} / ساعت</p>
    </div>
  );
}

export function WorkTimeAnalysisCharts({
  report,
  scope = "global",
}: WorkTimeAnalysisChartsProps) {
  const isProjectScope = scope === "project";
  const weeklyData = report.weeklyTotals.map((week) => ({
    name: week.label,
    minutes: week.minutes,
    hours: Number((week.minutes / 60).toFixed(1)),
  }));

  const projectHoursData = report.projectAnalysis
    .filter((row) => row.workedMinutes > 0)
    .slice(0, 8)
    .map((row) => ({
      name: row.title.length > 14 ? `${row.title.slice(0, 14)}…` : row.title,
      workedHours: Number((row.workedMinutes / 60).toFixed(1)),
      targetHours: row.targetMinutes
        ? Number((row.targetMinutes / 60).toFixed(1))
        : 0,
    }));

  const incomeData = report.projectAnalysis
    .filter((row) => row.incomePerHour && row.incomePerHour > 0)
    .slice(0, 6)
    .map((row) => ({
      name: row.title.length > 12 ? `${row.title.slice(0, 12)}…` : row.title,
      incomePerHour: row.incomePerHour ?? 0,
    }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="glass rounded-2xl p-4 lg:p-5">
        <h3 className="font-bold">
          {isProjectScope ? "کارکرد روزانه" : "کارکرد هفتگی"}
        </h3>
        <p className="mb-4 text-sm text-muted">{report.periodLabel}</p>
        {weeklyData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">داده‌ای برای نمودار نیست</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => toPersianDigits(String(v))}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<DurationTooltip />} />
                <Bar dataKey="minutes" fill="#059669" radius={[8, 8, 0, 0]} name="دقیقه" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {!isProjectScope ? (
        <section className="glass rounded-2xl p-4 lg:p-5">
          <h3 className="font-bold">ساعت کار به تفکیک پروژه</h3>
          <p className="mb-4 text-sm text-muted">کارکرد در مقابل هدف (ساعت)</p>
          {projectHoursData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">هنوز ساعتی ثبت نشده</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectHoursData} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="workedHours" fill="#0ea5e9" radius={[0, 6, 6, 0]} name="کارکرد" />
                  <Bar dataKey="targetHours" fill="#94a3b8" radius={[0, 6, 6, 0]} name="هدف" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      ) : null}

      {incomeData.length > 0 ? (
        <section
          className={`glass rounded-2xl p-4 lg:p-5 ${isProjectScope ? "" : "lg:col-span-2"}`}
        >
          <h3 className="font-bold">
            {isProjectScope ? "درآمد ساعتی این پروژه" : "درآمد ساعتی پروژه‌ها"}
          </h3>
          <p className="mb-4 text-sm text-muted">
            برای پروژه‌های ساعتی از دریافتی ماه تقسیم بر ساعت کار محاسبه شده
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => formatPrice(v)} tick={{ fontSize: 11 }} />
                <Tooltip content={<IncomeTooltip />} />
                <Bar dataKey="incomePerHour" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      ) : null}
    </div>
  );
}
