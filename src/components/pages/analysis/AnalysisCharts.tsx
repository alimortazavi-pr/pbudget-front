"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AnalyticsReport } from "@/common/interfaces/analytics.interface";
import { resolveCategoryColor } from "@/common/constants/category-colors";
import { formatPrice, toPersianDigits } from "@/common/utils";
import {
  CHART_COLORS,
  formatChartPrice,
} from "@/components/pages/analysis/chart-colors";

type AnalysisChartsProps = {
  report: AnalyticsReport;
  duration: string;
};

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-4 lg:p-5">
      <div className="mb-4">
        <h3 className="font-bold">{title}</h3>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatPrice(entry.value)} تومان
        </p>
      ))}
    </div>
  );
}

export function AnalysisCharts({ report, duration }: AnalysisChartsProps) {
  const expensePieData = useMemo(
    () =>
      report.topExpenses.slice(0, 8).map((item, index) => ({
        name: item.title,
        value: item.amount,
        fill: resolveCategoryColor(item.color, index),
      })),
    [report.topExpenses],
  );

  const incomePieData = useMemo(
    () =>
      report.topIncomes.slice(0, 8).map((item, index) => ({
        name: item.title,
        value: item.amount,
        fill: resolveCategoryColor(item.color, index),
      })),
    [report.topIncomes],
  );

  const paymentCardBarData = useMemo(
    () =>
      (report.byPaymentCard ?? [])
        .filter((item) => item.cost > 0 || item.income > 0)
        .slice(0, 8)
        .map((item) => ({
          name:
            item.title.length > 12 ? `${item.title.slice(0, 12)}…` : item.title,
          cost: item.cost,
          income: item.income,
        })),
    [report.byPaymentCard],
  );

  const cashFlowData = useMemo(() => {
    if (duration === "monthly" && report.dailyTrends.length > 0) {
      return report.dailyTrends.map((item) => ({
        label: toPersianDigits(item.label),
        income: item.income,
        cost: item.cost,
        net: item.net,
      }));
    }

    if (report.monthlyTrends.length > 0) {
      return report.monthlyTrends.map((item) => ({
        label: item.label,
        income: item.income,
        cost: item.cost,
        net: item.net,
      }));
    }

    return [
      {
        label: report.filters.periodLabel,
        income: report.summary.income,
        cost: report.summary.cost,
        net: report.summary.net,
      },
    ];
  }, [duration, report]);

  const overviewData = useMemo(
    () => [
      { name: "درآمد", value: report.summary.income, fill: CHART_COLORS.income },
      { name: "هزینه", value: report.summary.cost, fill: CHART_COLORS.cost },
    ].filter((item) => item.value > 0),
    [report.summary],
  );

  const overviewBarData = useMemo(
    () => [
      {
        name: report.filters.periodLabel,
        income: report.summary.income,
        cost: report.summary.cost,
      },
    ],
    [report.filters.periodLabel, report.summary],
  );

  const categoryBarData = useMemo(
    () =>
      report.byCategory
        .filter((item) => item.cost > 0 || item.income > 0)
        .slice(0, 10)
        .map((item) => ({
          name:
            item.title.length > 14
              ? `${item.title.slice(0, 14)}…`
              : item.title,
          income: item.income,
          cost: item.cost,
        })),
    [report.byCategory],
  );

  const boxData = report.boxes.filter((box) => box.balance > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold lg:text-xl">نمودارها</h2>
          <p className="text-sm text-muted">
            نمای تصویری درآمد، هزینه و توزیع دسته‌بندی‌ها
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="ترکیب دوره" subtitle="سهم درآمد و هزینه">
          {overviewData.length > 0 ? (
            <div className="pb-chart-canvas h-64 w-full min-h-[16rem]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <PieChart>
                  <Pie
                    data={overviewData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={88}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {overviewData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${formatPrice(Number(value ?? 0))} تومان`,
                      "مبلغ",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">
              برای نمایش نمودار، تراکنش ثبت کنید
            </p>
          )}
        </ChartCard>

        <ChartCard title="درآمد در برابر هزینه" subtitle="خلاصه همین بازه">
          <div className="pb-chart-canvas h-64 w-full min-h-[16rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart data={overviewBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatChartPrice} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="درآمد" fill={CHART_COLORS.income} radius={[8, 8, 0, 0]} />
                <Bar dataKey="cost" name="هزینه" fill={CHART_COLORS.cost} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="روند درآمد و هزینه"
          subtitle={
            duration === "monthly"
              ? "نمودار روزانه ماه جاری"
              : "روند ماهانه"
          }
        >
          <div className="pb-chart-canvas h-72 w-full min-h-[18rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={288}>
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.income} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_COLORS.income} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.cost} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={CHART_COLORS.cost} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatChartPrice} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="درآمد"
                  stroke={CHART_COLORS.income}
                  fill="url(#incomeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  name="هزینه"
                  stroke={CHART_COLORS.cost}
                  fill="url(#costGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="خالص دوره" subtitle="درآمد منهای هزینه">
          <div className="pb-chart-canvas h-72 w-full min-h-[18rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={288}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatChartPrice} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name="خالص" radius={[6, 6, 0, 0]}>
                  {cashFlowData.map((entry, index) => (
                    <Cell
                      key={`net-${index}`}
                      fill={entry.net >= 0 ? CHART_COLORS.income : CHART_COLORS.cost}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="توزیع هزینه‌ها" subtitle="بر اساس دسته‌بندی">
          {expensePieData.length > 0 ? (
            <div className="pb-chart-canvas h-72 w-full min-h-[18rem]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                <PieChart>
                  <Pie
                    data={expensePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {expensePieData.map((item, index) => (
                      <Cell key={`expense-${index}`} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${formatPrice(Number(value ?? 0))} تومان`,
                      "مبلغ",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">هزینه‌ای ثبت نشده</p>
          )}
        </ChartCard>

        <ChartCard title="توزیع درآمدها" subtitle="بر اساس دسته‌بندی">
          {incomePieData.length > 0 ? (
            <div className="pb-chart-canvas h-72 w-full min-h-[18rem]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                <PieChart>
                  <Pie
                    data={incomePieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {incomePieData.map((item, index) => (
                      <Cell key={`income-${index}`} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${formatPrice(Number(value ?? 0))} تومان`,
                      "مبلغ",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">درآمدی ثبت نشده</p>
          )}
        </ChartCard>
      </div>

      <ChartCard title="مقایسه دسته‌ها" subtitle="درآمد و هزینه هر دسته">
        {categoryBarData.length > 0 ? (
          <div className="pb-chart-canvas h-80 w-full min-h-[20rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <BarChart data={categoryBarData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis type="number" tickFormatter={formatChartPrice} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name="درآمد" fill={CHART_COLORS.income} radius={[0, 4, 4, 0]} />
                <Bar dataKey="cost" name="هزینه" fill={CHART_COLORS.cost} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted">داده‌ای موجود نیست</p>
        )}
      </ChartCard>

      {paymentCardBarData.length > 0 && (
        <ChartCard title="تراکنش‌ها بر اساس کارت" subtitle="پرداخت و دریافت در این بازه">
          <div className="pb-chart-canvas h-72 w-full min-h-[18rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={288}>
              <BarChart data={paymentCardBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatChartPrice} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="cost" name="پرداخت" fill={CHART_COLORS.cost} radius={[6, 6, 0, 0]} />
                <Bar dataKey="income" name="دریافت" fill={CHART_COLORS.income} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {boxData.length > 0 && (
          <ChartCard title="تخصیص صندوق‌ها" subtitle="سهم از کل دارایی نقدی">
            <div className="pb-chart-canvas h-64 w-full min-h-[16rem]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                <PieChart>
                  <Pie
                    data={[
                      ...boxData.map((box) => ({
                        name: box.title,
                        value: box.balance,
                      })),
                      {
                        name: "کیف پول اصلی",
                        value: report.summary.userBalance,
                      },
                    ].filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                  >
                    {boxData.map((_, index) => (
                      <Cell
                        key={`box-${index}`}
                        fill={CHART_COLORS.palette[index % CHART_COLORS.palette.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      `${formatPrice(Number(value ?? 0))} تومان`,
                      "موجودی",
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}

      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <CategoryTable
          title="پرتکرارترین هزینه‌ها"
          rows={report.topExpenses.map((item, index) => ({
            title: item.title,
            amount: item.amount,
            share: item.share,
            count: item.count,
            color: resolveCategoryColor(item.color, index),
          }))}
          amountLabel="هزینه"
        />
        <CategoryTable
          title="بیشترین درآمدها"
          rows={report.topIncomes.map((item, index) => ({
            title: item.title,
            amount: item.amount,
            share: item.share,
            count: item.count,
            color: resolveCategoryColor(item.color, index),
          }))}
          amountLabel="درآمد"
        />
      </div>
    </div>
  );
}

function CategoryTable({
  title,
  rows,
  amountLabel,
}: {
  title: string;
  rows: Array<{
    title: string;
    amount: number;
    share: number;
    count: number;
    color?: string;
  }>;
  amountLabel: string;
}) {
  return (
    <section className="glass rounded-2xl p-4 lg:p-5">
      <h3 className="mb-4 font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">داده‌ای موجود نیست</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted">
                <th className="pb-2 text-start font-medium">دسته</th>
                <th className="pb-2 text-start font-medium">{amountLabel}</th>
                <th className="pb-2 text-start font-medium">سهم</th>
                <th className="pb-2 text-start font-medium">تعداد</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.title} className="border-b border-border/30">
                  <td className="py-2.5 font-medium">
                    <span className="inline-flex items-center gap-2">
                      {row.color ? (
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                      ) : null}
                      {row.title}
                    </span>
                  </td>
                  <td className="py-2.5">{formatPrice(row.amount)}</td>
                  <td className="py-2.5">{toPersianDigits(row.share.toFixed(1))}٪</td>
                  <td className="py-2.5">{toPersianDigits(row.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
