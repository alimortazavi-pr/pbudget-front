export type AnalyticsDuration = "daily" | "monthly" | "yearly" | "all";
export type AnalyticsTypeFilter = "all" | "income" | "cost";

export type AnalyticsInsight = {
  id: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  title: string;
  body: string;
};

export type AnalyticsTrendPoint = {
  label: string;
  year?: number;
  month?: number;
  day?: number;
  income: number;
  cost: number;
  net: number;
  count?: number;
};

export type AnalyticsCategoryRow = {
  categoryId: string;
  title: string;
  parentTitle: string | null;
  income: number;
  cost: number;
  net: number;
  count: number;
  shareOfCost: number;
  shareOfIncome: number;
};

export type AnalyticsReport = {
  filters: {
    duration: AnalyticsDuration;
    year: string;
    month: string;
    day: string;
    category: string | null;
    type: AnalyticsTypeFilter;
    compare: boolean;
    periodLabel: string;
    monthName: string | null;
  };
  summary: {
    income: number;
    cost: number;
    net: number;
    savingsRate: number;
    transactionCount: number;
    avgDailyCost: number;
    avgTransactionCost: number;
    userBalance: number;
    boxesTotal: number;
    netWorth: number;
  };
  comparison: {
    income: number;
    cost: number;
    net: number;
    savingsRate: number;
    transactionCount: number;
    incomeChangePercent: number;
    costChangePercent: number;
    netChangePercent: number;
    currentPeriodLabel: string;
    previousPeriodLabel: string;
  } | null;
  credits: {
    count: number;
    totalDues: number;
    totalDebt: number;
    unpaidDues: number;
    unpaidDebt: number;
    paidDues: number;
    paidDebt: number;
  };
  boxes: Array<{
    id: string;
    title: string;
    balance: number;
    share: number;
  }>;
  byCategory: AnalyticsCategoryRow[];
  monthlyTrends: AnalyticsTrendPoint[];
  dailyTrends: AnalyticsTrendPoint[];
  topExpenses: Array<{
    categoryId: string;
    title: string;
    amount: number;
    share: number;
    count: number;
  }>;
  topIncomes: Array<{
    categoryId: string;
    title: string;
    amount: number;
    share: number;
    count: number;
  }>;
  insights: AnalyticsInsight[];
};
