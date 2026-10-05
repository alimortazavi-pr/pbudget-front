import { toPersianDigits } from "@/common/utils";

const dateTimeFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const relativeFormatter = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });

function toDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTimeFa(value?: string | Date | null, fallback = "—") {
  const date = toDate(value);
  return date ? dateTimeFormatter.format(date) : fallback;
}

export function formatDateFa(value?: string | Date | null, fallback = "—") {
  const date = toDate(value);
  return date ? dateFormatter.format(date) : fallback;
}

/** "۵ دقیقه پیش", "دیروز", "۳ ماه پیش" … */
export function formatRelativeFa(value?: string | Date | null, fallback = "هرگز") {
  const date = toDate(value);
  if (!date) return fallback;
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "همین الان";
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
    ["week", 604800],
    ["month", 2592000],
    ["year", 31536000],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let size = 60;
  for (const [name, length] of units) {
    if (abs >= length) {
      unit = name;
      size = length;
    }
  }
  return relativeFormatter.format(Math.round(seconds / size), unit);
}

/** Minutes since the user's last authenticated request. */
export function presenceOf(lastSeenAt?: string | null): "online" | "today" | "week" | "idle" | "never" {
  const date = toDate(lastSeenAt);
  if (!date) return "never";
  const diff = Date.now() - date.getTime();
  if (diff < 10 * 60_000) return "online";
  if (diff < 24 * 3600_000) return "today";
  if (diff < 7 * 24 * 3600_000) return "week";
  return "idle";
}

export const CURRENCY_LABELS: Record<string, string> = {
  toman: "تومان",
  usd: "دلار",
  dinar: "دینار",
};

export function formatMoneyFa(amount: number, currency = "toman") {
  const value = Number(amount) || 0;
  const formatted = new Intl.NumberFormat("fa-IR", {
    maximumFractionDigits: currency === "toman" ? 0 : 2,
  }).format(value);
  return `${formatted} ${CURRENCY_LABELS[currency] ?? currency}`;
}

export function formatNumberFa(value: number) {
  return new Intl.NumberFormat("fa-IR").format(Number(value) || 0);
}

export function formatPercentFa(value: number) {
  return `${toPersianDigits(String(Math.round(value * 10) / 10))}٪`;
}

/** Turn a user-agent into "Chrome · Android" style text. */
export function describeUserAgent(ua?: string | null) {
  if (!ua) return "نامشخص";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : /axios|node|curl|python/i.test(ua)
              ? "API"
              : "مرورگر";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iOS/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}
