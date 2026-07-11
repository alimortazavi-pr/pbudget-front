"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

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
          {entry.name}: {formatPrice(entry.value)} {t("common.toman")}
        </p>
      ))}
    </div>
  );
}

export function AnalysisCharts({ report, duration }: AnalysisChartsProps) {
  const { t } = useTranslation();
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
      { name: t("common.income"), value: report.summary.income, fill: CHART_COLORS.income },
      { name: t("common.expense"), value: report.summary.cost, fill: CHART_COLORS.cost },
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
          <h2 className="text-lg font-bold lg:text-xl">{t("auto.kf8c419ec92")}</h2>
          <p className="text-sm text-muted">
            {t("auto.kc76c3df1a7")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title={t("auto.k94c6c32903")} subtitle={t("auto.kfdb1236f54")}>
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
                      `${formatPrice(Number(value ?? 0))} ${t("common.toman")}`,
                      t("common.amount"),
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">
              {t("auto.k3c7e88f3ce")}
            </p>
          )}
        </ChartCard>

        <ChartCard title={t("auto.ke6ad730907")} subtitle={t("auto.k7fc2f6858c")}>
          <div className="pb-chart-canvas h-64 w-full min-h-[16rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
              <BarChart data={overviewBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatChartPrice} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name={t("common.income")} fill={CHART_COLORS.income} radius={[8, 8, 0, 0]} />
                <Bar dataKey="cost" name={t("common.expense")} fill={CHART_COLORS.cost} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title={t("auto.kb9aad2b7eb")}
          subtitle={
            duration === "monthly"
              ? t("auto.kc281155ebc")
              : t("auto.k8b91d7ff21")
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
                  name={t("common.income")}
                  stroke={CHART_COLORS.income}
                  fill="url(#incomeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="cost"
                  name={t("common.expense")}
                  stroke={CHART_COLORS.cost}
                  fill="url(#costGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title={t("auto.k35b908d245")} subtitle={t("auto.k5649ce19cc")}>
          <div className="pb-chart-canvas h-72 w-full min-h-[18rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={288}>
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatChartPrice} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name={t("auto.k306c8ddc1c")} radius={[6, 6, 0, 0]}>
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
        <ChartCard title={t("auto.k3e3995d7f3")} subtitle={t("auto.kf291cf2a60")}>
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
                      `${formatPrice(Number(value ?? 0))} ${t("common.toman")}`,
                      t("common.amount"),
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">{t("auto.kc845e40048")}</p>
          )}
        </ChartCard>

        <ChartCard title={t("auto.kb161d91f75")} subtitle={t("auto.kf291cf2a60")}>
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
                      `${formatPrice(Number(value ?? 0))} ${t("common.toman")}`,
                      t("common.amount"),
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted">{t("auto.k800efb967e")}</p>
          )}
        </ChartCard>
      </div>

      <ChartCard title={t("auto.k06b64776cc")} subtitle={t("auto.kb1e41b1722")}>
        {categoryBarData.length > 0 ? (
          <div className="pb-chart-canvas h-80 w-full min-h-[20rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
              <BarChart data={categoryBarData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis type="number" tickFormatter={formatChartPrice} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" name={t("common.income")} fill={CHART_COLORS.income} radius={[0, 4, 4, 0]} />
                <Bar dataKey="cost" name={t("common.expense")} fill={CHART_COLORS.cost} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-muted">{t("auto.ke4966467bc")}</p>
        )}
      </ChartCard>

      {paymentCardBarData.length > 0 && (
        <ChartCard title={t("auto.k337e6243ed")} subtitle={t("auto.k4595c69cd7")}>
          <div className="pb-chart-canvas h-72 w-full min-h-[18rem]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minHeight={288}>
              <BarChart data={paymentCardBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatChartPrice} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="cost" name={t("auto.k1025955b55")} fill={CHART_COLORS.cost} radius={[6, 6, 0, 0]} />
                <Bar dataKey="income" name={t("auto.k63397316b7")} fill={CHART_COLORS.income} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {boxData.length > 0 && (
          <ChartCard title={t("auto.kcac5d51cfc")} subtitle={t("auto.k41fe75d862")}>
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
                        name: t("auto.ka9c56f2829"),
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
                      `${formatPrice(Number(value ?? 0))} ${t("common.toman")}`,
                      t("auto.k90c9e7cad5"),
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
          title={t("auto.k56dac9be10")}
          rows={report.topExpenses.map((item, index) => ({
            title: item.title,
            amount: item.amount,
            share: item.share,
            count: item.count,
            color: resolveCategoryColor(item.color, index),
          }))}
          amountLabel={t("common.expense")}
        />
        <CategoryTable
          title={t("auto.k9e91112d6d")}
          rows={report.topIncomes.map((item, index) => ({
            title: item.title,
            amount: item.amount,
            share: item.share,
            count: item.count,
            color: resolveCategoryColor(item.color, index),
          }))}
          amountLabel={t("common.income")}
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
}) {  const { t } = useTranslation();

  return (
    <section className="glass rounded-2xl p-4 lg:p-5">
      <h3 className="mb-4 font-bold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t("auto.ke4966467bc")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-muted">
                <th className="pb-2 text-start font-medium">{t("auto.k32034c98af")}</th>
                <th className="pb-2 text-start font-medium">{amountLabel}</th>
                <th className="pb-2 text-start font-medium">{t("auto.k77e1e41b61")}</th>
                <th className="pb-2 text-start font-medium">{t("auto.kff10995101")}</th>
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
                  <td className="py-2.5">
                    {toPersianDigits(row.share.toFixed(1))}
                    {t("common.percentSign")}
                  </td>
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
