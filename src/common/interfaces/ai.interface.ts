export interface AiUsageStatus {
  hasAccess: boolean;
  limit: number;
  used: number;
  remaining: number;
  /** ISO time of the next reset (Tehran midnight). */
  resetsAt: string;
}

export interface AiStatus {
  enabled: boolean;
  usage: AiUsageStatus;
  model: { id: string; label: string };
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

export interface AiInsightsResponse {
  insights: AiInsights;
  period: string;
  cached: boolean;
  generatedAt: string;
  model: string;
  status: AiStatus;
}

export interface AiChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface AiChatResponse {
  reply: string;
  model: string;
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
  topUsers: Array<{ name: string; mobile: string; requests: number }>;
}

export type AiTestResult =
  | { ok: true; text: string; latencyMs: number; promptTokens: number; outputTokens: number }
  | { ok: false; error: string; status: number };
