import type { IBudget } from "@/common/interfaces/budget.interface";
import type {
  AnalyticsDuration,
  AnalyticsReport,
  AnalyticsTypeFilter,
} from "@/common/interfaces/analytics.interface";
import { resolveCategoryColor } from "@/common/constants/category-colors";
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

function resolvePaymentCardId(budget: IBudget) {
  const card = budget.paymentCard;
  if (!card) return null;
  return typeof card === "string" ? card : card._id;
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
    {
      title: string;
      color: string | null;
      monthlyLimit: number;
      income: number;
      cost: number;
      count: number;
    }
  >();

  filtered.forEach((budget) => {
    const categoryId = budget.category?._id ?? "unknown";
    const title = budget.category?.title ?? "نامشخص";
    const current = categoryMap.get(categoryId) ?? {
      title,
      color: budget.category?.color ?? null,
      monthlyLimit: budget.category?.monthlyLimit ?? 0,
      income: 0,
      cost: 0,
      count: 0,
    };
    current.count += 1;
    if (budget.type === INCOME_TYPE) current.income += budget.price;
    else current.cost += budget.price;
    categoryMap.set(categoryId, current);
  });

  const byCategory = [...categoryMap.entries()].map(([categoryId, values], index) => {
    const monthlyLimit = values.monthlyLimit ?? 0;
    const limitRemaining =
      monthlyLimit > 0 ? monthlyLimit - values.cost : null;
    const overLimitAmount =
      monthlyLimit > 0 && values.cost > monthlyLimit
        ? values.cost - monthlyLimit
        : 0;
    const percentOfLimit =
      monthlyLimit > 0 ? (values.cost / monthlyLimit) * 100 : null;

    return {
      categoryId,
      title: values.title,
      parentTitle: null,
      color: values.color || resolveCategoryColor(null, index),
      monthlyLimit,
      limitRemaining,
      overLimitAmount,
      percentOfLimit,
      income: values.income,
      cost: values.cost,
      net: values.income - values.cost,
      count: values.count,
      shareOfCost: cost > 0 ? (values.cost / cost) * 100 : 0,
      shareOfIncome: income > 0 ? (values.income / income) * 100 : 0,
    };
  });

  const cardMap = new Map<
    string,
    {
      title: string;
      bankName: string;
      lastFour: string;
      color: string | null;
      income: number;
      cost: number;
      count: number;
    }
  >();

  filtered.forEach((budget) => {
    const cardId = resolvePaymentCardId(budget);
    if (!cardId || typeof budget.paymentCard === "string") return;

    const card = budget.paymentCard;
    if (!card || typeof card === "string") return;

    const current = cardMap.get(cardId) ?? {
      title: card.title,
      bankName: card.bankName ?? "",
      lastFour: card.lastFour ?? "",
      color: card.color ?? null,
      income: 0,
      cost: 0,
      count: 0,
    };
    current.count += 1;
    if (budget.type === INCOME_TYPE) current.income += budget.price;
    else current.cost += budget.price;
    cardMap.set(cardId, current);
  });

  const byPaymentCard = [...cardMap.entries()].map(([cardId, values]) => ({
    cardId,
    title: values.title,
    bankName: values.bankName,
    lastFour: values.lastFour,
    color: values.color,
    income: values.income,
    cost: values.cost,
    net: values.income - values.cost,
    count: values.count,
  }));

  const categoryBudgets = byCategory
    .filter((row) => row.monthlyLimit > 0)
    .map((row) => ({
      categoryId: row.categoryId,
      title: row.title,
      color: row.color,
      monthlyLimit: row.monthlyLimit,
      spent: row.cost,
      remaining: row.limitRemaining ?? 0,
      overLimitAmount: row.overLimitAmount,
      percentOfLimit: row.percentOfLimit ?? 0,
      isOverLimit: row.overLimitAmount > 0,
    }))
    .sort((a, b) => b.percentOfLimit - a.percentOfLimit);

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
      color: item.color,
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
      color: item.color,
    }));

  const overBudget = categoryBudgets.filter((row) => row.isOverLimit);
  const insights: AnalyticsReport["insights"] = [
    {
      id: "fallback",
      severity: "neutral",
      title: "حالت آفلاین تحلیل",
      body: "گزارش کامل از سرور دریافت نشد؛ نمودارها از تراکنش‌های همین دوره ساخته شده‌اند.",
    },
  ];

  if (overBudget.length > 0) {
    insights.push({
      id: "over-budget-fallback",
      severity: "warning",
      title: "عبور از سقف بودجه",
      body: `${overBudget.length} دسته از سقف ماهانه عبور کرده‌اند.`,
    });
  }

  return {
    filters: {
      duration,
      year,
      month,
      day,
      category: null,
      paymentCard: null,
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
      avgTransactionCost:
        cost /
        Math.max(filtered.filter((b) => b.type === COST_TYPE).length || 1, 1),
      userBalance,
      boxesTotal,
      netWorth: userBalance + boxesTotal,
    },
    comparison: null,
    boxes: [],
    byCategory,
    byPaymentCard,
    categoryBudgets,
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
    insights,
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
