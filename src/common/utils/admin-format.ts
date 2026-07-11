import { getTranslator } from "@/i18n";

export function formatBytes(bytes: number): string {
  const t = getTranslator();
  if (!Number.isFinite(bytes) || bytes <= 0) return t("auto.k131996d58c");

  const units = [
    t("auto.k0f79f76ef5"),
    t("auto.kb5c0124493"),
    t("auto.k5936f06955"),
    t("auto.kca85caa98a"),
  ];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;

  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatUptime(seconds: number): string {
  const t = getTranslator();
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return t("common.uptimeDaysHours", { days, hours });
  if (hours > 0) return t("common.uptimeHoursMinutes", { hours, minutes });
  return t("common.uptimeMinutes", { minutes });
}
