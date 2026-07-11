import type { MessageTree } from "../../types";

export const adminMessages: MessageTree = {
  transactionSaved: "Transaction saved",
  contentLoadFailed: "Failed to load content",
  contentManagement: "Content management",
  csvHint: "Excel / Google Sheets",
  exportSuccess: "Export {{name}} completed successfully",
  restoreSuccess: "Restored {{count}} documents",
  connectedLatency: "Connected ({{ms}}ms)",
  deleteBankConfirm: "Delete bank «{{name}}»?",
  protectedCollectionsHint:
    "backuphistories and adminauditlogs collections are protected",
};
