"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useMemo, useState } from "react";
import { Button, Checkbox } from "@heroui/react";
import { ArrowDown2, ArrowSwapVertical, ArrowUp2 } from "iconsax-reactjs";

import { AppCheckbox, AppSearch } from "@/components/common/form/AppControls";
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
import { moneyDisplayUnitLabel } from "@/common/utils/money-display";
import {
  CHART_COLORS,
  formatChartPrice,
} from "@/components/pages/analysis/chart-colors";

export type AnalysisSection = "overview" | "expenses" | "income" | "assets";

type AnalysisChartsProps = {
  report: AnalyticsReport;
  duration: string;
  section: AnalysisSection;
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
          {entry.name}: {formatPrice(entry.value)} {moneyDisplayUnitLabel()}
        </p>
      ))}
    </div>
  );
}

export function AnalysisCharts({ report, duration, section }: AnalysisChartsProps) {
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
    [report.summary, t],
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
      {section === "overview" && (
        <>
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
                      `${formatPrice(Number(value ?? 0))} ${moneyDisplayUnitLabel()}`,
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
        </>
      )}

      {section === "expenses" && (
        <>
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
                      `${formatPrice(Number(value ?? 0))} ${moneyDisplayUnitLabel()}`,
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
          </div>
          <CategoryBreakdown rows={report.byCategory} />
        </>
      )}

      {section === "income" && (
        <div className="grid gap-4 xl:grid-cols-2">
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
                      `${formatPrice(Number(value ?? 0))} ${moneyDisplayUnitLabel()}`,
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
      )}

      {section === "assets" && (
        <>
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
                      `${formatPrice(Number(value ?? 0))} ${moneyDisplayUnitLabel()}`,
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
        </>
      )}
    </div>
  );
}

type SortKey = "title" | "income" | "cost" | "net" | "count";
type SortDirection = "asc" | "desc";

/**
 * Per-category table the user can sort by any column, search, and narrow to a
 * hand-picked set of categories — with a total for exactly that selection.
 */
function CategoryBreakdown({
  rows,
}: {
  rows: AnalyticsReport["byCategory"];
}) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("cost");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [onlySelected, setOnlySelected] = useState(false);

  const usedRows = useMemo(
    () =>
      rows
        .filter((row) => row.income > 0 || row.cost > 0)
        .map((row, index) => ({ ...row, key: row.categoryId || row.title, color: resolveCategoryColor(row.color, index) })),
    [rows],
  );

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = usedRows.filter(
      (row) => (!needle || row.title.toLowerCase().includes(needle)) && (!onlySelected || selected.has(row.key)),
    );
    const factor = direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) =>
      sortKey === "title" ? factor * a.title.localeCompare(b.title, "fa") : factor * (a[sortKey] - b[sortKey]),
    );
  }, [usedRows, query, onlySelected, selected, sortKey, direction]);

  const selectedRows = useMemo(() => usedRows.filter((row) => selected.has(row.key)), [usedRows, selected]);
  const totals = useMemo(() => {
    const sum = (key: "income" | "cost" | "net" | "count") => selectedRows.reduce((acc, row) => acc + row[key], 0);
    const allCost = usedRows.reduce((acc, row) => acc + row.cost, 0);
    const cost = sum("cost");
    return { income: sum("income"), cost, net: sum("net"), count: sum("count"), share: allCost > 0 ? (cost / allCost) * 100 : 0 };
  }, [selectedRows, usedRows]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) setDirection((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDirection(key === "title" ? "asc" : "desc");
    }
  }

  function toggleRow(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selected.has(row.key));
  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      visibleRows.forEach((row) => (allVisibleSelected ? next.delete(row.key) : next.add(row.key)));
      return next;
    });
  }

  const unit = moneyDisplayUnitLabel();
  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "title", label: t("pages.analysis.category") },
    { key: "income", label: t("pages.analysis.income") },
    { key: "cost", label: t("pages.analysis.expense") },
    { key: "net", label: t("pages.analysis.net") },
    { key: "count", label: t("pages.analysis.transactions") },
  ];

  return (
    <section className="glass rounded-2xl p-4 lg:p-5">
      <div className="mb-4">
        <h3 className="font-bold">{t("pages.analysis.categoryBreakdownTitle")}</h3>
        <p className="mt-1 text-sm text-muted">{t("pages.analysis.categoryBreakdownDescription")}</p>
      </div>
      {usedRows.length === 0 ? (
        <p className="text-sm text-muted">{t("auto.ke4966467bc")}</p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <AppSearch
              className="min-w-48 max-w-xs flex-1"
              ariaLabel={t("pages.analysis.categorySearch")}
              placeholder={t("pages.analysis.categorySearch")}
              value={query}
              onChange={setQuery}
            />
            <AppCheckbox isSelected={onlySelected} onChange={setOnlySelected}>
              {t("pages.analysis.onlySelected")}
            </AppCheckbox>
            {selected.size > 0 ? (
              <Button size="sm" variant="ghost" onPress={() => { setSelected(new Set()); setOnlySelected(false); }}>
                {t("pages.analysis.clearSelection")}
              </Button>
            ) : null}
          </div>

          {selected.size > 0 ? (
            <div className="mb-3 grid grid-cols-2 gap-3 rounded-2xl border border-accent/30 bg-accent/8 p-3 text-sm sm:grid-cols-5" aria-live="polite">
              <div>
                <p className="text-xs text-muted">{t("pages.analysis.selectedCount")}</p>
                <p className="font-bold">{toPersianDigits(selected.size)}</p>
              </div>
              <div>
                <p className="text-xs text-muted">{t("pages.analysis.income")}</p>
                <p className="font-semibold">{formatPrice(totals.income)} {unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted">{t("pages.analysis.expense")}</p>
                <p className="font-bold text-danger">{formatPrice(totals.cost)} {unit}</p>
              </div>
              <div>
                <p className="text-xs text-muted">{t("pages.analysis.shareOfExpense")}</p>
                <p className="font-semibold">{toPersianDigits(totals.share.toFixed(1))}٪</p>
              </div>
              <div>
                <p className="text-xs text-muted">{t("pages.analysis.transactions")}</p>
                <p className="font-semibold">{toPersianDigits(totals.count)}</p>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-muted">
                  <th className="w-10 pb-2 text-start">
                    <Checkbox aria-label={t("pages.analysis.selectAll")} isSelected={allVisibleSelected} onChange={toggleAllVisible} variant="secondary">
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox>
                  </th>
                  {columns.map((column) => {
                    const active = column.key === sortKey;
                    return (
                      <th key={column.key} className="pb-2 text-start font-medium" aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className={`inline-flex cursor-pointer items-center gap-1 rounded-lg px-1 py-0.5 transition hover:text-foreground ${active ? "font-bold text-foreground" : ""}`}
                        >
                          {column.label}
                          {active ? (
                            direction === "asc" ? <ArrowUp2 size={14} variant="Bold" /> : <ArrowDown2 size={14} variant="Bold" />
                          ) : (
                            <ArrowSwapVertical size={13} className="opacity-50" />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const isSelected = selected.has(row.key);
                  return (
                    <tr key={row.key} className={`border-b border-border/30 ${isSelected ? "bg-accent/6" : ""}`}>
                      <td className="py-2.5">
                        <Checkbox aria-label={row.title} isSelected={isSelected} onChange={() => toggleRow(row.key)} variant="secondary">
                          <Checkbox.Control>
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox>
                      </td>
                      <td className="py-2.5 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                          {row.title}
                        </span>
                      </td>
                      <td className="py-2.5">{formatPrice(row.income)} {unit}</td>
                      <td className="py-2.5">{formatPrice(row.cost)} {unit}</td>
                      <td className={`py-2.5 font-semibold ${row.net >= 0 ? "text-success-foreground" : "text-danger"}`}>
                        {formatPrice(row.net)} {unit}
                      </td>
                      <td className="py-2.5">{toPersianDigits(row.count)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleRows.length === 0 ? <p className="py-6 text-center text-sm text-muted">{t("pages.analysis.noCategoryMatch")}</p> : null}
          </div>
        </>
      )}
    </section>
  );
}
