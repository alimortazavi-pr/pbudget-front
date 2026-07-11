import { getTranslator } from "@/i18n";
const t = getTranslator();
import { toast } from "@heroui/react";

import { getApiErrorMessage } from "./api-error";

export function showToast(
  message: string,
  type: "success" | "danger" | "warning" = "danger",
) {
  const normalized = message.trim();
  if (type === "success") toast.success(normalized);
  else if (type === "warning") toast.warning(normalized);
  else toast.danger(normalized);
}

export function showErrorToast(error: unknown, fallback = t("common.error")) {
  showToast(getApiErrorMessage(error, fallback));
}
