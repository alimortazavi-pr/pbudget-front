import type { MessageTree } from "../../types";

export const voiceMessages: MessageTree = {
  title: "المساعد الصوتي",
  subtitle: "تجريبي — راجع التفاصيل مرة بعد التعرف",
  testBanner:
    "هذه الميزة في وضع الاختبار. تحقق دائمًا من المبلغ والفئة والتاريخ قبل التأكيد.",
  processing: "جارٍ المعالجة…",
  listening: "جارٍ الاستماع…",
  example: "مثال: «دفعت ١٠ ملايين للقهوة اليوم»",
  typePlaceholder: "أو اكتب رسالتك هنا…",
  recognizedText: "النص المُتعرَّف عليه",
  actionSummary: "ملخص الإجراء",
  confidence: "الثقة: {{percent}}٪",
  cannotExecute: "لا يمكن تنفيذ الأمر — تحدث بوضوح أكبر أو عدّل النص.",
  recording: "جارٍ التسجيل…",
  startRecording: "بدء التسجيل",
  analyzeText: "تحليل النص",
  executing: "جارٍ التنفيذ…",
  confirmExecute: "تأكيد وتنفيذ",
  cancelAction: "إلغاء",
  newCommand: "أمر جديد",
  interpretError: "فشل تفسير الأمر",
  executeError: "فشل تنفيذ الأمر",
};
