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

export interface VoiceExecuteResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
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
  create_budget: "ثبت تراکنش",
  create_task: "ثبت تسک",
  append_note: "افزودن یادداشت",
  create_debt: "ثبت طلب/بدهی",
  create_check: "ثبت چک",
  create_payment_plan: "ثبت برنامه پرداخت",
  create_category: "ساخت دسته‌بندی",
  create_box: "ساخت صندوق",
  create_payment_card: "ساخت کارت",
  create_running_tab: "ثبت تعهد جاری",
  query_balance: "مشاهده موجودی",
  navigate: "رفتن به صفحه",
  unknown: "نامشخص",
};

export const VOICE_STATUS_LABELS: Record<VoiceLogStatus, string> = {
  pending: "در انتظار تأیید",
  confirmed: "تأیید شده",
  executed: "اجرا شده",
  cancelled: "لغو شده",
  failed: "ناموفق",
};
