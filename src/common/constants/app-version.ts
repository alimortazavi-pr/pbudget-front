/** نسخه فعلی اپ — با package.json هماهنگ نگه دارید */
export const APP_VERSION = "2.0.0";

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  items: string[];
};

/**
 * هر بار که فیچر جدید اضافه می‌کنید:
 * 1. APP_VERSION را بالا ببرید
 * 2. package.json → version را هم به‌روز کنید
 * 3. یک entry جدید به CHANGELOG اضافه کنید
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "2.0.0",
    date: "۱۴۰۴/۰۴/۰۷",
    title: "نسخه ۲ — بازطراحی کامل",
    items: [
      "حذف حالت دوگانه HMI و یکپارچه‌سازی رابط کاربری",
      "صفحه تنظیمات جداگانه با دسترسی از سایدبار",
      "سیستم راهنمای تعاملی (تور) برای کاربران جدید",
      "دستیار صوتی در تمام بخش‌های اپ",
      "بهبود تم تاریک/روشن و رفع تداخل رنگ‌ها",
      "سازماندهی بهتر ابزارها در منوی کناری",
    ],
  },
];

export function getChangelogSince(version: string | null): ChangelogEntry[] {
  if (!version) return CHANGELOG;

  const idx = CHANGELOG.findIndex((e) => e.version === version);
  if (idx === -1) return CHANGELOG;
  return CHANGELOG.slice(0, idx);
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isNewerVersion(current: string, lastSeen: string | null): boolean {
  if (!lastSeen) return true;
  return compareVersions(current, lastSeen) > 0;
}
