import type { SupportCategory, SupportPriority, SupportStatus } from "@/common/api/support";

export const STATUS_LABEL: Record<SupportStatus, string> = { open: "در انتظار پاسخ", answered: "پاسخ داده شد", closed: "بسته" };
export const STATUS_TONE: Record<SupportStatus, "warning" | "success" | "neutral"> = { open: "warning", answered: "success", closed: "neutral" };
export const CATEGORY_LABEL: Record<SupportCategory, string> = {
  general: "عمومی",
  billing: "پرداخت و اشتراک",
  bug: "گزارش مشکل",
  feature: "پیشنهاد",
  account: "حساب کاربری",
};
export const PRIORITY_LABEL: Record<SupportPriority, string> = { urgent: "فوری", high: "زیاد", normal: "عادی", low: "کم" };
export const PRIORITY_TONE: Record<SupportPriority, "danger" | "warning" | "neutral" | "info"> = {
  urgent: "danger",
  high: "warning",
  normal: "neutral",
  low: "info",
};
export const SOURCE_LABEL = { landing: "فرم سایت", app: "اپ", admin: "شروع‌شده توسط ادمین", system: "پیام خودکار" } as const;

/** Fills {{name}}, {{firstName}} and {{code}} in a canned reply. */
export function fillCannedReply(text: string, ticket: { name: string; code: string }) {
  const firstName = ticket.name.trim().split(/\s+/)[0] ?? "";
  return text
    .replace(/\{\{\s*name\s*\}\}/g, ticket.name)
    .replace(/\{\{\s*firstName\s*\}\}/g, firstName)
    .replace(/\{\{\s*code\s*\}\}/g, ticket.code);
}
