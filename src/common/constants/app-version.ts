/** Current app version — keep in sync with package.json */
export const APP_VERSION = "2.0.0";

export type ChangelogEntryMeta = {
  version: string;
  dateKey: string;
  titleKey: string;
  itemKeys: string[];
};

/**
 * When shipping a new feature:
 * 1. Bump APP_VERSION
 * 2. Update package.json → version
 * 3. Add a new entry to CHANGELOG_META and i18n changelog messages
 */
export const CHANGELOG_META: ChangelogEntryMeta[] = [
  {
    version: "2.0.0",
    dateKey: "changelog.v200.date",
    titleKey: "changelog.v200.title",
    itemKeys: [
      "changelog.v200.items.i1",
      "changelog.v200.items.i2",
      "changelog.v200.items.i3",
      "changelog.v200.items.i4",
      "changelog.v200.items.i5",
      "changelog.v200.items.i6",
    ],
  },
];

export function getChangelogSince(version: string | null): ChangelogEntryMeta[] {
  if (!version) return CHANGELOG_META;

  const idx = CHANGELOG_META.findIndex((e) => e.version === version);
  if (idx === -1) return CHANGELOG_META;
  return CHANGELOG_META.slice(0, idx);
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
