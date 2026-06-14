import { toast } from "@heroui/react";

export function showToast(
  message: string,
  type: "success" | "danger" | "warning" = "danger",
) {
  if (type === "success") toast.success(message);
  else if (type === "warning") toast.warning(message);
  else toast.danger(message);
}
