"use client";

import { Devices, LoginCurve } from "iconsax-reactjs";

import type { AdminUserOverview } from "@/common/interfaces/admin";
import { AdminPanel, EmptyState, Pill } from "../ui/AdminUi";
import { describeUserAgent, formatDateTimeFa, formatNumberFa, formatRelativeFa } from "../ui/admin-format";

const LOGIN_LABELS: Record<string, string> = {
  "auth.register": "ثبت‌نام",
  "auth.login_password": "ورود با رمز",
  "auth.login_otp": "ورود با کد تلگرام",
  "auth.password_reset": "بازیابی رمز",
  "auth.workspace_selected": "انتخاب فضای کاری",
};

export function UserSecurityTab({ overview }: { overview: AdminUserOverview }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <AdminPanel title="ورودهای اخیر" description="ثبت‌نام، ورود و بازیابی رمز">
        {overview.logins.length === 0 ? (
          <EmptyState icon={<LoginCurve size={32} />} title="ورودی ثبت نشده" />
        ) : (
          <ul className="divide-y divide-border/50">
            {overview.logins.map((login) => (
              <li key={login._id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{LOGIN_LABELS[login.action] ?? login.action}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {describeUserAgent(login.userAgent)}
                    {login.ip ? <span dir="ltr"> · {login.ip}</span> : null}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted" title={formatDateTimeFa(login.createdAt)}>
                  {formatRelativeFa(login.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <AdminPanel
        title="دستگاه‌ها و مرورگرها"
        description="بر اساس درخواست‌های اخیر"
        actions={overview.user.sessionRevoked ? <Pill tone="warning">نشست‌ها باطل شده</Pill> : null}
      >
        {overview.devices.length === 0 ? (
          <EmptyState icon={<Devices size={32} />} title="دستگاهی ثبت نشده" />
        ) : (
          <ul className="divide-y divide-border/50">
            {overview.devices.map((device) => (
              <li key={device.userAgent} className="py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{describeUserAgent(device.userAgent)}</p>
                  <span className="text-xs text-muted">{formatRelativeFa(device.lastSeen)}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-muted" dir="ltr" title={device.userAgent}>
                  {device.userAgent}
                </p>
                <p className="text-[11px] text-muted">{formatNumberFa(device.requests)} درخواست</p>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </div>
  );
}
