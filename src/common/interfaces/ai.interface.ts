export interface AiUsageStatus {
  hasAccess: boolean;
  blocked: boolean;
  limit: number;
  used: number;
  remaining: number;
  /** ISO time of the next reset (Tehran midnight). */
  resetsAt: string;
}

export interface AiStatus {
  enabled: boolean;
  usage: AiUsageStatus;
}

export type AiInsightTone = "good" | "warn" | "risk" | "info";
export type AiInsightImpact = "high" | "medium" | "low";

export interface AiInsights {
  headline: string;
  summary: string;
  highlights: Array<{ title: string; detail: string; tone: AiInsightTone }>;
  actions: Array<{ title: string; detail: string; impact: AiInsightImpact; estimatedMonthlySaving: number | null }>;
  watchouts: string[];
  savingsGoal: { monthlyAmount: number; rationale: string } | null;
}

/** Figures computed by the server (never written by the model). */
export interface AiInsightFacts {
  kpis: {
    income: number;
    cost: number;
    net: number;
    savingsRate: number;
    transactionCount: number;
    incomeChange: number | null;
    costChange: number | null;
    previousLabel: string | null;
  };
  categories: Array<{ title: string; color: string | null; cost: number; share: number }>;
  forecast: { daysPassed: number; daysInMonth: number; projectedCost: number } | null;
}

export interface AiInsightsResponse {
  insights: AiInsights;
  facts: AiInsightFacts;
  period: string;
  cached: boolean;
  generatedAt: string;
  status: AiStatus;
}

export type AiObligationKind = "installment" | "check_payable" | "check_receivable" | "debt_payable" | "debt_receivable";

export interface AiPlanBudget {
  categoryId: string;
  title: string;
  average: number;
  limit: number | null;
  suggested: number;
  reason: string;
}

export interface AiPlan {
  headline: string;
  summary: string;
  savingsTarget: number;
  budgets: AiPlanBudget[];
  steps: Array<{ when: "week1" | "week2" | "week3" | "week4" | "any"; title: string; detail: string }>;
  risks: string[];
}

export interface AiPlanFacts {
  target: { year: number; month: number; label: string; days: number };
  history: Array<{ label: string; income: number; cost: number }>;
  expectedIncome: number;
  averageCost: number;
  obligations: Array<{ kind: AiObligationKind; title: string; day: number; amount: number }>;
  fixedOutflow: number;
  expectedInflowUncertain: number;
  boxes: Array<{ title: string; balance: number; goal: number | null }>;
  walletBalance: number;
}

export interface AiPlanResponse {
  plan: AiPlan;
  facts: AiPlanFacts;
  totals: { budgeted: number; fixed: number; savings: number; leftover: number };
  cached: boolean;
  generatedAt: string;
  status: AiStatus;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AiChatResponse {
  reply: string;
  followUps: string[];
  status: AiStatus;
}

// ---- admin ----

export interface AiSettings {
  enabled: boolean;
  chatModel: string;
  insightsModel: string;
  fallbackModels: string[];
  temperature: number;
  maxOutputTokens: number;
  defaultDailyLimit: number;
  chatHistoryLimit: number;
  insightsCacheHours: number;
  systemPromptExtra: string;
}

export interface AiModelOption {
  id: string;
  label: string;
  available: boolean | null;
  family?: "gemini" | "gemma";
  speed?: "fast" | "medium" | "slow";
  freeRpm?: number;
  freeRpd?: number;
  freeTpm?: number;
  roles?: Array<"primary" | "fallback" | "quality">;
  note?: string;
}

export interface AiModelCatalog {
  recommended: AiModelOption[];
  others: AiModelOption[];
  liveListLoaded: boolean;
  keyConfigured: boolean;
}

export interface AiStats {
  rangeDays: number;
  today: string;
  totals: {
    requests: number;
    ok: number;
    failed: number;
    promptTokens: number;
    outputTokens: number;
    avgLatencyMs: number;
    activeUsers: number;
  };
  byDay: Array<{ day: string; ok: number; failed: number; tokens: number }>;
  byModel: Array<{
    model: string;
    label: string;
    calls: number;
    ok: number;
    fallbackCalls: number;
    rateLimited: number;
    avgLatencyMs: number;
    promptTokens: number;
    outputTokens: number;
    last24h: number;
    freeRpd: number | null;
  }>;
  byKind: Array<{ kind: string; calls: number }>;
  topUsers: Array<{ userId: string; name: string; mobile: string; requests: number }>;
}

export type AiTestResult =
  | { ok: true; text: string; latencyMs: number; promptTokens: number; outputTokens: number }
  | { ok: false; error: string; status: number };

export interface AiAdminPlanRow {
  id: string;
  slug: string;
  name: string;
  price: number;
  priceUnit: string;
  active: boolean;
  enabled: boolean;
  limit: number | null;
}

export interface AiAdminPlans {
  defaultDailyLimit: number;
  plans: AiAdminPlanRow[];
}

export interface AiAdminUser {
  userId: string;
  name: string;
  mobile: string;
  hasAccess: boolean;
  blocked: boolean;
  planLimit: number;
  override: number | null;
  effectiveLimit: number;
  usedToday: number;
}
