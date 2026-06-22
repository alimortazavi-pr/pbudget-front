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
