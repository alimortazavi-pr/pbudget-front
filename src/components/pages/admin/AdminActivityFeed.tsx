"use client";

import Link from "next/link";
import {
  AddCircle,
  Edit2,
  Eye,
  LoginCurve,
  Trash,
  Warning2,
} from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import type { AdminActivityItem } from "@/common/interfaces/admin";
import { describeUserAgent, formatDateTimeFa, formatRelativeFa } from "./ui/admin-format";
import { Pill } from "./ui/AdminUi";

const KIND_STYLE: Record<AdminActivityItem["kind"], { icon: typeof AddCircle; className: string }> = {
  create: { icon: AddCircle, className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" },
  update: { icon: Edit2, className: "bg-sky-500/12 text-sky-600 dark:text-sky-300" },
  delete: { icon: Trash, className: "bg-rose-500/12 text-rose-600 dark:text-rose-300" },
  auth: { icon: LoginCurve, className: "bg-violet-500/12 text-violet-600 dark:text-violet-300" },
  view: { icon: Eye, className: "bg-surface-secondary text-muted" },
};

export function ActivityRow({ item, showUser = true }: { item: AdminActivityItem; showUser?: boolean }) {
  const style = item.ok ? KIND_STYLE[item.kind] : { icon: Warning2, className: "bg-danger/12 text-danger" };
  const IconComponent = style.icon;
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${style.className}`}>
        <IconComponent size={17} variant="Bold" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {showUser && item.userId ? (
            <Link href={PATHS.ADMIN_USER(item.userId)} className="text-sm font-semibold hover:text-accent">
              {item.userName || "کاربر"}
            </Link>
          ) : null}
          <span className="text-sm">{item.label}</span>
          {item.detail ? <span className="truncate text-xs text-muted">· {item.detail}</span> : null}
          {!item.ok ? (
            <Pill tone="danger">
              خطا {item.statusCode ?? ""}
            </Pill>
          ) : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
          <span title={formatDateTimeFa(item.createdAt)}>{formatRelativeFa(item.createdAt)}</span>
          <span>· {item.featureLabel}</span>
          {item.userAgent ? <span>· {describeUserAgent(item.userAgent)}</span> : null}
          {!item.ok && item.errorMessage ? <span className="text-danger">· {item.errorMessage}</span> : null}
        </div>
      </div>
    </li>
  );
}

export function ActivityList({ items, showUser = true }: { items: AdminActivityItem[]; showUser?: boolean }) {
  return (
    <ul className="divide-y divide-border/50">
      {items.map((item) => (
        <ActivityRow key={item._id} item={item} showUser={showUser} />
      ))}
    </ul>
  );
}
