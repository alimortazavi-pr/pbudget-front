export const CHART_COLORS = {
  income: "#10b981",
  cost: "#f43f5e",
  net: "#8b5cf6",
  accent: "#e11d48",
  muted: "#94a3b8",
  palette: [
    "#e11d48",
    "#8b5cf6",
    "#0ea5e9",
    "#10b981",
    "#f59e0b",
    "#f43f5e",
    "#6366f1",
    "#14b8a6",
    "#ec4899",
    "#84cc16",
  ],
};

export function formatChartPrice(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return String(value);
}
