import { axiosInstance } from "@/common/axiosInstance";
import type {
  AiChatMessage,
  AiChatResponse,
  AiInsightsResponse,
  AiModelCatalog,
  AiSettings,
  AiStats,
  AiStatus,
  AiTestResult,
} from "@/common/interfaces/ai.interface";

// The model can take a while; the server already falls back across models.
const AI_TIMEOUT_MS = 120_000;

export async function fetchAiStatus() {
  const { data } = await axiosInstance.get<AiStatus>("/ai/status");
  return data;
}

export async function requestAiInsights(params: { duration?: "monthly" | "yearly" | "all"; year?: string; month?: string; force?: boolean }) {
  const { data } = await axiosInstance.post<AiInsightsResponse>("/ai/insights", params, { timeout: AI_TIMEOUT_MS });
  return data;
}

export async function sendAiChat(messages: AiChatMessage[], includeContext = true) {
  const { data } = await axiosInstance.post<AiChatResponse>("/ai/chat", { messages, includeContext }, { timeout: AI_TIMEOUT_MS });
  return data;
}

export async function fetchAdminAiSettings() {
  const { data } = await axiosInstance.get<AiSettings>("/admin/ai/settings");
  return data;
}

export async function updateAdminAiSettings(payload: Partial<AiSettings>) {
  const { data } = await axiosInstance.put<AiSettings>("/admin/ai/settings", payload);
  return data;
}

export async function fetchAdminAiModels() {
  const { data } = await axiosInstance.get<AiModelCatalog>("/admin/ai/models");
  return data;
}

export async function fetchAdminAiStats(days = 14) {
  const { data } = await axiosInstance.get<AiStats>("/admin/ai/stats", { params: { days } });
  return data;
}

export async function testAdminAiModel(model: string, prompt: string) {
  const { data } = await axiosInstance.post<AiTestResult>("/admin/ai/test", { model, prompt }, { timeout: AI_TIMEOUT_MS });
  return data;
}
