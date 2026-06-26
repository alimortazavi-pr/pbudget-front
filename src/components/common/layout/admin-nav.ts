import {
  Chart,
  CloudAdd,
  Data,
  DocumentText,
  Home2,
  Microphone2,
  Mobile,
  People,
  ShieldSearch,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";

export const ADMIN_NAV = [
  {
    href: PATHS.ADMIN,
    label: "داشبورد",
    icon: Home2,
  },
  {
    href: PATHS.ADMIN_USERS,
    label: "کاربران",
    icon: People,
  },
  {
    href: PATHS.ADMIN_CONTENT,
    label: "مدیریت محتوا",
    icon: DocumentText,
  },
  {
    href: PATHS.ADMIN_APP,
    label: "اپ اندروید",
    icon: Mobile,
  },
  {
    href: PATHS.ADMIN_DATABASE,
    label: "مدیریت دیتابیس",
    icon: Data,
  },
  {
    href: PATHS.ADMIN_BACKUP,
    label: "بکاپ و خروجی",
    icon: CloudAdd,
  },
  {
    href: PATHS.ADMIN_AUDIT,
    label: "لاگ عملیات",
    icon: ShieldSearch,
  },
  {
    href: PATHS.ADMIN_VOICE,
    label: "لاگ صوتی",
    icon: Microphone2,
  },
] as const;

export const ADMIN_MONITORING_NAV = [
  {
    href: PATHS.ADMIN,
    label: "مانیتورینگ",
    icon: Chart,
  },
] as const;
