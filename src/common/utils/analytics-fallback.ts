import type { IBudget } from "@/common/interfaces/budget.interface";
import type {
  AnalyticsDuration,
  AnalyticsReport,
  AnalyticsTypeFilter,
} from "@/common/interfaces/analytics.interface";
import { JALALI_MONTHS } from "@/common/utils/jalali-date";

const INCOME_TYPE = 0;
const COST_TYPE = 1;

type BuildFallbackParams = {
  budgets: IBudget[];
  totalIncomePrice: number;
  totalCostPrice: number;
  userBalance: number;
  boxesTotal: number;
  duration: AnalyticsDuration;
  year: string;
  month: string;
  day: string;
  type: AnalyticsTypeFilter;
};

function filterBudgetsByType(budgets: IBudget[], type: AnalyticsTypeFilter) {
  if (type === "income") {
    return budgets.filter((budget) => budget.type === INCOME_TYPE);
  }
  if (type === "cost") {
    return budgets.filter((budget) => budget.type === COST_TYPE);
  }
  return budgets;
}

export function buildClientAnalyticsReport({
  budgets,
  totalIncomePrice,
  totalCostPrice,
  userBalance,
  boxesTotal,
  duration,
  year,
  month,
  day,
  type,
}: BuildFallbackParams): AnalyticsReport {
  const filtered = filterBudgetsByType(budgets, type);

  let income = 0;
  let cost = 0;
  filtered.forEach((budget) => {
    if (budget.type === INCOME_TYPE) income += budget.price;
    else cost += budget.price;
  });

  if (type === "income") {
    cost = 0;
    income = totalIncomePrice;
  } else if (type === "cost") {
    income = 0;
    cost = totalCostPrice;
  } else {
    income = totalIncomePrice;
    cost = totalCostPrice;
  }

  const net = income - cost;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  const periodLabel = formatPeriodLabel(duration, year, month, day);

  const categoryMap = new Map<
    string,
    { title: string; income: number; cost: number; count: number }
  >();

  filtered.forEach((budget) => {
    const categoryId = budget.category?._id ?? "unknown";
    const title = budget.category?.title ?? "نامشخص";
    const current = categoryMap.get(categoryId) ?? {
      title,
      income: 0,
      cost: 0,
      count: 0,
    };
    current.count += 1;
    if (budget.type === INCOME_TYPE) current.income += budget.price;
    else current.cost += budget.price;
    categoryMap.set(categoryId, current);
  });

  const byCategory = [...categoryMap.entries()].map(([categoryId, values]) => ({
    categoryId,
    title: values.title,
    parentTitle: null,
    income: values.income,
    cost: values.cost,
    net: values.income - values.cost,
    count: values.count,
    shareOfCost: cost > 0 ? (values.cost / cost) * 100 : 0,
    shareOfIncome: income > 0 ? (values.income / income) * 100 : 0,
  }));

  const dailyMap = new Map<
    number,
    { income: number; cost: number; count: number }
  >();
  filtered.forEach((budget) => {
    const dayNum = Number(budget.day);
    const current = dailyMap.get(dayNum) ?? { income: 0, cost: 0, count: 0 };
    current.count += 1;
    if (budget.type === INCOME_TYPE) current.income += budget.price;
    else current.cost += budget.price;
    dailyMap.set(dayNum, current);
  });

  const dailyTrends = [...dailyMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([dayNum, values]) => ({
      label: String(dayNum),
      day: dayNum,
      income: values.income,
      cost: values.cost,
      net: values.income - values.cost,
      count: values.count,
    }));

  const topExpenses = byCategory
    .filter((item) => item.cost > 0)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8)
    .map((item) => ({
      categoryId: item.categoryId,
      title: item.title,
      amount: item.cost,
      share: item.shareOfCost,
      count: item.count,
    }));

  const topIncomes = byCategory
    .filter((item) => item.income > 0)
    .sort((a, b) => b.income - a.income)
    .slice(0, 8)
    .map((item) => ({
      categoryId: item.categoryId,
      title: item.title,
      amount: item.income,
      share: item.shareOfIncome,
      count: item.count,
    }));

  return {
    filters: {
      duration,
      year,
      month,
      day,
      category: null,
      type,
      compare: false,
      periodLabel,
      monthName: null,
    },
    summary: {
      income,
      cost,
      net,
      savingsRate,
      transactionCount: filtered.length,
      avgDailyCost: cost / Math.max(dailyTrends.length || 1, 1),
      avgTransactionCost: cost / Math.max(filtered.filter((b) => b.type === COST_TYPE).length || 1, 1),
      userBalance,
      boxesTotal,
      netWorth: userBalance + boxesTotal,
    },
    comparison: null,
    credits: {
      count: 0,
      totalDues: 0,
      totalDebt: 0,
      unpaidDues: 0,
      unpaidDebt: 0,
      paidDues: 0,
      paidDebt: 0,
    },
    boxes: [],
    byCategory,
    monthlyTrends: [
      {
        label: periodLabel,
        income,
        cost,
        net,
      },
    ],
    dailyTrends,
    topExpenses,
    topIncomes,
    insights: [
      {
        id: "fallback",
        severity: "neutral",
        title: "حالت آفلاین تحلیل",
        body: "گزارش کامل از سرور دریافت نشد؛ نمودارها از تراکنش‌های همین دوره ساخته شده‌اند. برای تحلیل کامل، بک‌اند را به‌روز کنید.",
      },
    ],
  };
}

export function formatPeriodLabel(
  duration: AnalyticsDuration,
  year: string,
  month: string,
  day: string,
) {
  const monthName = JALALI_MONTHS[Number(month) - 1] ?? month;
  if (duration === "daily") return `${day} ${monthName} ${year}`;
  if (duration === "monthly") return `${monthName} ${year}`;
  if (duration === "yearly") return `سال ${year}`;
  return "تمام دوره";
}
