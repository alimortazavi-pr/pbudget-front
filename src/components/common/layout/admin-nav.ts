import {
  Activity,
  Bank,
  CloudAdd,
  Crown,
  Data,
  DocumentText,
  Home2,
  LoginCurve,
  Mobile,
  Monitor,
  People,
  Radar,
  ShieldSearch,
} from "iconsax-reactjs";
import type { Icon } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";

export type AdminNavItem = { href: string; label: string; icon: Icon };

/** Grouped by what the administrator is trying to do. */
export const ADMIN_NAV_GROUPS: { title: string; items: AdminNavItem[] }[] = [
  {
    title: "nav.adminGroupMonitor",
    items: [
      { href: PATHS.ADMIN, label: "nav.adminDashboard", icon: Home2 },
      { href: PATHS.ADMIN_ACTIVITY, label: "nav.adminActivity", icon: Radar },
      { href: PATHS.ADMIN_USERS, label: "nav.adminUsers", icon: People },
      { href: PATHS.ADMIN_SUBSCRIPTIONS, label: "nav.adminSubscriptions", icon: Crown },
    ],
  },
  {
    title: "nav.adminGroupContent",
    items: [
      { href: PATHS.ADMIN_LANDING, label: "nav.adminLanding", icon: Monitor },
      { href: PATHS.ADMIN_CONTENT, label: "nav.adminContent", icon: DocumentText },
      { href: PATHS.ADMIN_APP, label: "nav.adminApp", icon: Mobile },
      { href: PATHS.ADMIN_BANKS, label: "nav.adminBanks", icon: Bank },
    ],
  },
  {
    title: "nav.adminGroupSystem",
    items: [
      { href: PATHS.ADMIN_DATABASE, label: "nav.adminDatabase", icon: Data },
      { href: PATHS.ADMIN_BACKUP, label: "nav.adminBackup", icon: CloudAdd },
      { href: PATHS.ADMIN_AUDIT, label: "nav.adminAudit", icon: ShieldSearch },
      { href: PATHS.ADMIN_AUTH_AUDIT, label: "nav.adminAuthAudit", icon: LoginCurve },
      { href: PATHS.ADMIN_LOGS, label: "nav.adminSystemLogs", icon: Activity },
    ],
  },
];

export const ADMIN_NAV: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
