import { getTranslator } from "@/i18n";
const t = getTranslator();
import type { UserCurrency, WalletBalances } from "@/common/constants/user-preferences";

export type VoiceLogStatus =
  | "pending"
  | "confirmed"
  | "executed"
  | "cancelled"
  | "failed";

export type VoiceIntent =
  | "create_budget"
  | "create_task"
  | "append_note"
  | "create_debt"
  | "create_check"
  | "create_payment_plan"
  | "create_category"
  | "create_box"
  | "create_payment_card"
  | "create_running_tab"
  | "query_balance"
  | "navigate"
  | "unknown";

export interface VoiceField {
  key: string;
  label: string;
  value: string;
}

export interface VoiceInterpretation {
  intent: VoiceIntent;
  confidence: number;
  summary: string;
  payload: Record<string, unknown>;
  warnings: string[];
  fields: VoiceField[];
}

export interface VoiceLog {
  _id: string;
  user: string;
  userName: string;
  transcript: string;
  intent: VoiceIntent;
  confidence: number;
  status: VoiceLogStatus;
  interpretation: VoiceInterpretation | null;
  executionResult: Record<string, unknown> | null;
  errorMessage: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string | null;
  updatedAt?: string | null;
}

export interface VoiceInterpretResponse {
  log: VoiceLog;
  interpretation: VoiceInterpretation;
  testModeNotice: string;
}

export interface VoiceExecuteData {
  userBudget?: number;
  userWalletBalances?: WalletBalances;
  currency?: UserCurrency;
  balance?: number;
}

export interface VoiceExecuteResult {
  success: boolean;
  message: string;
  data?: VoiceExecuteData;
  navigateTo?: string;
}

export interface VoiceExecuteResponse {
  log: VoiceLog;
  result: VoiceExecuteResult;
}

export interface VoiceLogListResponse {
  items: VoiceLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const VOICE_INTENT_LABELS: Record<VoiceIntent, string> = {
  create_budget: t("nav.createTransaction"),
  create_task: t("auto.ke51d1974cf"),
  append_note: t("auto.kee56384340"),
  create_debt: t("auto.k2c9432b987"),
  create_check: t("auto.k1c362cffea"),
  create_payment_plan: t("auto.k26771f07bb"),
  create_category: t("auto.k74540ab69f"),
  create_box: t("auto.kdc64fa5bf3"),
  create_payment_card: t("auto.kd555739ada"),
  create_running_tab: t("auto.k6e01e9750b"),
  query_balance: t("auto.kc79238dd23"),
  navigate: t("auto.k5556ff2273"),
  unknown: t("auto.k264f61d0e1"),
};

export const VOICE_STATUS_LABELS: Record<VoiceLogStatus, string> = {
  pending: t("auto.k7474af631f"),
  confirmed: t("auto.k70a9e2700d"),
  executed: t("auto.k8e368f3df3"),
  cancelled: t("auto.kdf91c21da7"),
  failed: t("auto.kd904fc219b"),
};
