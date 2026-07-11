import type { MessageTree } from "../../types";

export const adminMessages: MessageTree = {
  transactionSaved: "تراکنش ذخیره شد",
  contentLoadFailed: "بارگذاری محتوا ناموفق بود",
  contentManagement: "مدیریت محتوا",
  csvHint: "اکسل / Google Sheets",
  exportSuccess: "خروجی {{name}} با موفقیت انجام شد",
  restoreSuccess: "بازیابی {{count}} سند انجام شد",
  connectedLatency: "متصل ({{ms}}ms)",
  deleteBankConfirm: "بانک «{{name}}» حذف شود؟",
  protectedCollectionsHint:
    "کالکشن‌های backuphistories و adminauditlogs محافظت شده‌اند",
};
