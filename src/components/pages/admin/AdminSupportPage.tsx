"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, TextArea } from "@heroui/react";
import { Messages2 } from "iconsax-reactjs";

import * as supportApi from "@/common/api/support";
import type { AdminTicketList, SupportStatus, SupportTicket } from "@/common/api/support";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AdminPageHeader, AdminPanel, EmptyState, PaginationBar, Pill, SearchField, SegmentedTabs, SkeletonRows, StatTile } from "./ui/AdminUi";
import { formatDateTimeFa } from "./ui/admin-format";

const STATUS_LABEL: Record<SupportStatus, string> = { open: "در انتظار پاسخ", answered: "پاسخ داده شد", closed: "بسته" };
const STATUS_TONE: Record<SupportStatus, "warning" | "success" | "neutral"> = { open: "warning", answered: "success", closed: "neutral" };
const CATEGORY_LABEL: Record<string, string> = { general: "عمومی", billing: "پرداخت و اشتراک", bug: "مشکل", feature: "پیشنهاد", account: "حساب" };

function TicketRow({ ticket, onChanged }: { ticket: SupportTicket; onChanged: () => void }) {
  const [open, setOpen] = useState(ticket.status === "open");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const thread = [{ from: "user" as const, text: ticket.message, at: ticket.createdAt, _id: "first" }, ...ticket.replies];

  async function run(action: () => Promise<void>, done: string) {
    setBusy(true);
    try {
      await action();
      showToast(done, "success");
      setDraft("");
      onChanged();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-2xl border border-border/60 bg-surface">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-start">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {ticket.name} <span className="text-xs font-normal text-muted" dir="ltr">{ticket.phone || ticket.email}</span>
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">
            <span dir="ltr">{ticket.code}</span> · {CATEGORY_LABEL[ticket.category] ?? ticket.category} · {ticket.source === "app" ? "از اپ" : "از سایت"} · {formatDateTimeFa(ticket.lastActivityAt)}
          </p>
        </div>
        <Pill tone={STATUS_TONE[ticket.status]}>{STATUS_LABEL[ticket.status]}</Pill>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border/50 p-4">
          {ticket.subject ? <p className="text-sm font-semibold">{ticket.subject}</p> : null}
          {thread.map((item) => (
            <div key={item._id} className={`flex ${item.from === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-7 ${item.from === "user" ? "bg-surface-secondary" : "bg-accent/12"}`}>
                <p className="mb-0.5 text-[11px] font-semibold text-muted">
                  {item.from === "user" ? ticket.name : "پشتیبانی"} · {formatDateTimeFa(item.at)}
                </p>
                <p className="whitespace-pre-wrap break-words">{item.text}</p>
              </div>
            </div>
          ))}
          {ticket.status !== "closed" ? (
            <TextArea variant="secondary" rows={3} className="w-full" aria-label="پاسخ" placeholder={ticket.user ? "پاسخ شما برای کاربر (در سایت و بات‌ها ارسال می‌شود)" : "این پیام از لندینگ آمده و حساب ندارد؛ از راه تلفن/ایمیل پاسخ دهید"} value={draft} maxLength={4000} onChange={(event) => setDraft(event.target.value)} />
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            {ticket.status === "closed" ? (
              <Button size="sm" variant="secondary" isPending={busy} onPress={() => void run(() => supportApi.adminSetTicketStatus(ticket._id, "open"), "گفتگو دوباره باز شد")}>
                بازگشایی
              </Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" isPending={busy} onPress={() => void run(() => supportApi.adminSetTicketStatus(ticket._id, "closed"), "گفتگو بسته شد")}>
                  بستن
                </Button>
                <Button size="sm" isPending={busy} isDisabled={draft.trim().length < 2 || !ticket.user} onPress={() => void run(() => supportApi.adminReplyToTicket(ticket._id, draft.trim()), "پاسخ ارسال شد")}>
                  ارسال پاسخ
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function AdminSupportPage() {
  const [status, setStatus] = useState<"" | SupportStatus>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminTicketList | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await supportApi.fetchAdminTickets({ status, search, page }));
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = data?.summary;
  return (
    <div className="space-y-5">
      <AdminPageHeader title="پیام‌های پشتیبانی" description="پیام‌های فرم تماس سایت و بخش پشتیبانی اپ. پاسخ شما در سایت و در بات تلگرام/بله کاربر (اگر وصل باشد) می‌رسد." icon={<Messages2 size={22} variant="Bold" />} />
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="در انتظار پاسخ" value={summary?.open ?? 0} tone={summary?.open ? "warning" : "success"} />
        <StatTile label="پاسخ داده‌شده" value={summary?.answered ?? 0} tone="success" />
        <StatTile label="بسته‌شده" value={summary?.closed ?? 0} tone="info" />
      </div>
      <AdminPanel
        title="صندوق پیام‌ها"
        actions={
          <SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="کد، نام، موبایل یا متن…" className="w-56" />
        }
      >
        <div className="mb-4">
          <SegmentedTabs
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            items={[
              { id: "", label: "همه" },
              { id: "open", label: "در انتظار", count: summary?.open },
              { id: "answered", label: "پاسخ داده شد" },
              { id: "closed", label: "بسته" },
            ]}
          />
        </div>
        {loading && !data ? (
          <SkeletonRows rows={4} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="پیامی پیدا نشد" />
        ) : (
          <ul className="space-y-3">
            {data.items.map((ticket) => (
              <TicketRow key={ticket._id} ticket={ticket} onChanged={() => void load()} />
            ))}
          </ul>
        )}
        <PaginationBar pagination={data?.pagination} onPage={setPage} />
      </AdminPanel>
    </div>
  );
}
