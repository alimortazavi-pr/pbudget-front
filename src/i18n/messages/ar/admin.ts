import type { MessageTree } from "../../types";

export const adminMessages: MessageTree = {
  transactionSaved: "تم حفظ المعاملة",
  contentLoadFailed: "فشل تحميل المحتوى",
  contentManagement: "إدارة المحتوى",
  csvHint: "Excel / Google Sheets",
  exportSuccess: "تم تصدير {{name}} بنجاح",
  restoreSuccess: "تمت استعادة {{count}} مستند",
  connectedLatency: "متصل ({{ms}}ms)",
  deleteBankConfirm: "حذف البنك «{{name}}»؟",
  protectedCollectionsHint:
    "مجموعتا backuphistories و adminauditlogs محميتان",
};
