import type { MessageTree } from "../../types";

export const voiceMessages: MessageTree = {
  title: "دستیار صوتی",
  subtitle: "محیط آزمایشی — پس از تشخیص، یک‌بار جزئیات را بررسی کنید",
  testBanner:
    "این قابلیت در حالت تست است. قبل از تأیید، مبلغ، دسته و تاریخ را حتماً چک کنید.",
  processing: "در حال پردازش…",
  listening: "در حال گوش دادن…",
  example: "مثال: «مبلغ ۱۰ ت برای کافه امروز پرداخت شد»",
  typePlaceholder: "یا متن را اینجا بنویسید…",
  recognizedText: "متن تشخیص‌داده‌شده",
  actionSummary: "خلاصه عملیات",
  confidence: "اطمینان: {{percent}}٪",
  cannotExecute: "دستور قابل اجرا نیست — لطفاً واضح‌تر بگویید یا متن را اصلاح کنید.",
  recording: "در حال ضبط…",
  startRecording: "شروع ضبط",
  analyzeText: "تحلیل متن",
  executing: "در حال اجرا…",
  confirmExecute: "تأیید و اجرا",
  cancelAction: "لغو",
  newCommand: "دستور جدید",
  interpretError: "تفسیر دستور ناموفق بود",
  executeError: "اجرای دستور ناموفق بود",
};
