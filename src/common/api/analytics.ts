import { axiosInstance } from "@/common/axiosInstance";
import type {
  AnalyticsDuration,
  AnalyticsReport,
  AnalyticsTypeFilter,
} from "@/common/interfaces/analytics.interface";

export type AnalyticsReportParams = {
  duration: AnalyticsDuration;
  year: string;
  month: string;
  day: string;
  category?: string;
  paymentCard?: string;
  type?: AnalyticsTypeFilter;
  compare?: boolean;
};

export async function fetchAnalyticsReport(params: AnalyticsReportParams) {
  const { data } = await axiosInstance.get<AnalyticsReport>("/analytics/report", {
    params: {
      duration: params.duration,
      year: params.year,
      month: params.month,
      day: params.day,
      category: params.category || undefined,
      paymentCard: params.paymentCard || undefined,
      type: params.type ?? "all",
      compare: params.compare ? "true" : "false",
    },
  });
  return data;
}

export type CategoryTotals = {
  currency: string;
  periodLabel: string;
  totalCost: number;
  totalIncome: number;
  categories: {
    categoryId: string;
    title: string;
    parentTitle: string | null;
    color: string | null;
    cost: number;
    income: number;
    count: number;
    shareOfCost: number;
    shareOfIncome: number;
  }[];
};

/** Per-category totals for a period; part of the free plan. */
export async function fetchCategoryTotals(params: {
  duration: AnalyticsDuration;
  year: string;
  month: string;
  day: string;
  type?: AnalyticsTypeFilter;
}) {
  const { data } = await axiosInstance.get<CategoryTotals>("/analytics/categories", {
    params: { ...params, type: params.type ?? "all" },
  });
  return data;
}
