import {
  Chart,
  CloudAdd,
  Data,
  DocumentText,
  Home2,
  LoginCurve,
  Microphone2,
  Mobile,
  Monitor,
  People,
  ShieldSearch,
  Bank,
  Activity,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";

export const ADMIN_NAV = [
  {
    href: PATHS.ADMIN,
    label: "nav.adminDashboard",
    icon: Home2,
  },
  {
    href: PATHS.ADMIN_USERS,
    label: "nav.adminUsers",
    icon: People,
  },
  {
    href: PATHS.ADMIN_LANDING,
    label: "nav.adminLanding",
    icon: Monitor,
  },
  {
    href: PATHS.ADMIN_CONTENT,
    label: "nav.adminContent",
    icon: DocumentText,
  },
  {
    href: PATHS.ADMIN_APP,
    label: "nav.adminApp",
    icon: Mobile,
  },
  {
    href: PATHS.ADMIN_BANKS,
    label: "nav.adminBanks",
    icon: Bank,
  },
  {
    href: PATHS.ADMIN_DATABASE,
    label: "nav.adminDatabase",
    icon: Data,
  },
  {
    href: PATHS.ADMIN_BACKUP,
    label: "nav.adminBackup",
    icon: CloudAdd,
  },
  {
    href: PATHS.ADMIN_AUDIT,
    label: "nav.adminAudit",
    icon: ShieldSearch,
  },
  {
    href: PATHS.ADMIN_AUTH_AUDIT,
    label: "nav.adminAuthAudit",
    icon: LoginCurve,
  },
  {
    href: PATHS.ADMIN_LOGS,
    label: "nav.adminSystemLogs",
    icon: Activity,
  },
  {
    href: PATHS.ADMIN_VOICE,
    label: "nav.adminVoiceLogs",
    icon: Microphone2,
  },
] as const;

export const ADMIN_MONITORING_NAV = [
  {
    href: PATHS.ADMIN,
    label: "nav.adminMonitoring",
    icon: Chart,
  },
] as const;
