"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Call, Crown, ExportSquare, Sms } from "iconsax-reactjs";

import { fetchUserActivity, fetchUserOverview } from "@/common/api/admin-insights";
import { fetchAdminTickets, type AdminTicketDetail, type AdminTicketListItem } from "@/common/api/support";
import { PATHS } from "@/common/constants";
import type { AdminActivityItem, AdminUserOverview } from "@/common/interfaces/admin/insights.interface";
import { KeyValue, Pill, PresenceDot, SkeletonRows, UserAvatar } from "../ui/AdminUi";
import { describeUserAgent, formatDateFa, formatNumberFa, formatRelativeFa } from "../ui/admin-format";
import { STATUS_LABEL, STATUS_TONE } from "./support-labels";

/** Who the admin is talking to: plan, usage, recent actions and other conversations. */
export function SupportUserContext({ ticket, onOpenTicket }: { ticket: AdminTicketDetail; onOpenTicket: (id: string) => void }) {
  const userId = ticket.user;
  const [overview, setOverview] = useState<AdminUserOverview | null>(null);
  const [activity, setActivity] = useState<AdminActivityItem[] | null>(null);
  const [others, setOthers] = useState<AdminTicketListItem[] | null>(null);

  useEffect(() => {
    setOverview(null);
    setActivity(null);
    setOthers(null);
    if (!userId) return;
    let alive = true;
    void fetchUserOverview(userId).then((data) => alive && setOverview(data)).catch(() => undefined);
    void fetchUserActivity(userId, { limit: 8 })
      .then((data) => alive && setActivity(data.items))
      .catch(() => alive && setActivity([]));
    void fetchAdminTickets({ userId })
      .then((data) => alive && setOthers(data.items.filter((item) => item._id !== ticket._id)))
      .catch(() => alive && setOthers([]));
    return () => {
      alive = false;
    };
  }, [userId, ticket._id]);

  if (!userId) {
    return (
      <div className="space-y-3 p-4 text-sm">
        <p className="font-bold">{ticket.name}</p>
        <p className="leading-6 text-muted">این پیام از فرم تماس سایت آمده و به حساب کاربری وصل نیست. از راه تلفن یا ایمیل پاسخ دهید.</p>
        <div className="flex flex-wrap gap-2">
          {ticket.phone ? (
            <a href={`tel:${ticket.phone}`} className="inline-flex items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-2 text-xs font-semibold">
              <Call size={16} /> <span dir="ltr">{ticket.phone}</span>
            </a>
          ) : null}
          {ticket.email ? (
            <a href={`mailto:${ticket.email}`} className="inline-flex items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-2 text-xs font-semibold">
              <Sms size={16} /> <span dir="ltr">{ticket.email}</span>
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  const user = overview?.user;
  const subscription = overview?.subscription;
  const planName = subscription?.subscription?.plan?.name ?? subscription?.subscription?.planSnapshot?.name;

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center gap-3">
        <UserAvatar name={ticket.name} size={44} />
        <div className="min-w-0">
          <p className="truncate font-bold">{ticket.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span dir="ltr">{ticket.phone}</span>
            {user ? <PresenceDot lastSeenAt={user.lastSeenAt} withLabel /> : null}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={PATHS.ADMIN_USER(userId)} className="inline-flex items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-2 text-xs font-semibold hover:text-accent">
          <ExportSquare size={16} /> پروفایل کامل
        </Link>
        {ticket.phone ? (
          <a href={`tel:${ticket.phone}`} className="inline-flex items-center gap-1.5 rounded-xl bg-surface-secondary px-3 py-2 text-xs font-semibold hover:text-accent">
            <Call size={16} /> تماس
          </a>
        ) : null}
      </div>

      {!overview ? (
        <SkeletonRows rows={4} height="h-8" />
      ) : (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-muted">
            <Crown size={14} /> اشتراک و استفاده
          </p>
          <KeyValue label="پلن">
            {planName ?? "رایگان"}
            {subscription?.trial?.active ? <Pill tone="info" className="ms-1">آزمایشی</Pill> : null}
          </KeyValue>
          {subscription?.daysRemaining != null ? <KeyValue label="روز باقی‌مانده">{formatNumberFa(subscription.daysRemaining)}</KeyValue> : null}
          {subscription?.pendingRequest ? <KeyValue label="درخواست در انتظار">{subscription.pendingRequest.plan?.name ?? "دارد"}</KeyValue> : null}
          <KeyValue label="عضویت">{formatDateFa(overview.user.createdAt)}</KeyValue>
          <KeyValue label="آخرین حضور">{formatRelativeFa(overview.user.lastSeenAt)}</KeyValue>
          <KeyValue label="تعداد ورود">{formatNumberFa(overview.user.loginCount)}</KeyValue>
          <KeyValue label="تراکنش ۳۰ روز اخیر">{formatNumberFa(overview.transactionsLast30Days)}</KeyValue>
          <KeyValue label="آخرین تراکنش">{formatRelativeFa(overview.lastTransactionAt, "ندارد")}</KeyValue>
          <KeyValue label="بات تلگرام">{overview.user.telegramLinked ? "وصل" : "وصل نیست"}</KeyValue>
          {overview.devices[0] ? <KeyValue label="دستگاه اخیر">{describeUserAgent(overview.devices[0].userAgent)}</KeyValue> : null}
          {overview.user.adminNote ? (
            <p className="mt-2 rounded-xl bg-warning/10 p-2 text-xs leading-6">
              <span className="font-bold">یادداشت ادمین: </span>
              {overview.user.adminNote}
            </p>
          ) : null}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-bold text-muted">فعالیت‌های اخیر</p>
        {activity === null ? (
          <SkeletonRows rows={3} height="h-6" />
        ) : activity.length === 0 ? (
          <p className="text-xs text-muted">فعالیتی ثبت نشده.</p>
        ) : (
          <ul className="space-y-1.5">
            {activity.map((item) => (
              <li key={item._id} className="flex items-start justify-between gap-2 text-xs">
                <span className={`min-w-0 ${item.ok ? "" : "text-danger"}`}>
                  {item.label}
                  {item.detail ? <span className="block truncate text-muted">{item.detail}</span> : null}
                </span>
                <span className="shrink-0 text-muted">{formatRelativeFa(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-muted">گفتگوهای دیگر این کاربر</p>
        {others === null ? (
          <SkeletonRows rows={2} height="h-6" />
        ) : others.length === 0 ? (
          <p className="text-xs text-muted">گفتگوی دیگری ندارد.</p>
        ) : (
          <ul className="space-y-1.5">
            {others.slice(0, 6).map((item) => (
              <li key={item._id}>
                <button type="button" onClick={() => onOpenTicket(item._id)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-start text-xs hover:bg-surface-secondary">
                  <span className="min-w-0 truncate">{item.subject || item.lastMessage?.text || item.code}</span>
                  <Pill tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
