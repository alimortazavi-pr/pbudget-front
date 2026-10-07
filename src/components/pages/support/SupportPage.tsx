"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Chip, Input, TextArea } from "@heroui/react";
import { Call, Clock, DirectboxSend, Message2, MessageQuestion, Sms, TickCircle } from "iconsax-reactjs";

import * as supportApi from "@/common/api/support";
import type { SupportCategory, SupportStatus, SupportTicket } from "@/common/api/support";
import { CONTACT_EMAIL } from "@/common/constants/brand";
import { toPersianDigits } from "@/common/utils";
import { SUPPORT_PHONE } from "@/components/common/layout/shell-nav";
import { formatIsoDateTimeJalali } from "@/common/utils/jalali-date";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppSelect } from "@/components/common/form/AppControls";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { useTranslation } from "@/components/providers/LanguageProvider";

const CATEGORIES: SupportCategory[] = ["billing", "bug", "account", "feature", "general"];
const STATUS_COLOR: Record<SupportStatus, "warning" | "success" | "default"> = {
  open: "warning",
  answered: "success",
  closed: "default",
};
const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") || "paradisebudget_bot";
const BALE_BOT = "paradisedesk_bot";

function TicketCard({ ticket, onChanged }: { ticket: SupportTicket; onChanged: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(ticket.unreadByUser);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && ticket.unreadByUser) void supportApi.markTicketRead(ticket._id).then(onChanged).catch(() => undefined);
    // Marking read once when the card opens is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function send() {
    if (draft.trim().length < 2) return;
    setSending(true);
    try {
      await supportApi.replyToTicket(ticket._id, draft.trim());
      setDraft("");
      onChanged();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSending(false);
    }
  }

  const thread = [{ from: "user" as const, text: ticket.message, at: ticket.createdAt, _id: "first" }, ...ticket.replies];

  return (
    <article className="rounded-2xl border border-border/60 bg-surface">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-start">
        <div className="min-w-0">
          <p className="truncate font-semibold">{ticket.subject || t(`common.helpDesk.categories.${ticket.category}`)}</p>
          <p className="mt-0.5 text-xs text-muted" dir="ltr">
            {ticket.code} · {formatIsoDateTimeJalali(ticket.lastActivityAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ticket.unreadByUser ? <Chip size="sm" color="accent">{t("common.helpDesk.newReply")}</Chip> : null}
          <Chip size="sm" color={STATUS_COLOR[ticket.status]}>{t(`common.helpDesk.status.${ticket.status}`)}</Chip>
        </div>
      </button>
      {open ? (
        <div className="space-y-3 border-t border-border/50 p-4">
          {thread.map((item) => (
            <div key={item._id} className={`flex ${item.from === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-7 ${item.from === "user" ? "bg-surface-secondary" : "bg-accent/12"}`}>
                <p className="mb-0.5 text-[11px] font-semibold text-muted">
                  {item.from === "user" ? t("common.helpDesk.you") : t("common.helpDesk.team")} · {formatIsoDateTimeJalali(item.at)}
                </p>
                <p className="whitespace-pre-wrap break-words">{item.text}</p>
              </div>
            </div>
          ))}
          {ticket.status === "closed" ? (
            <p className="text-xs text-muted">{t("common.helpDesk.closedNote")}</p>
          ) : (
            <div className="flex items-end gap-2">
              <TextArea
                variant="secondary"
                rows={2}
                className="w-full"
                aria-label={t("common.helpDesk.reply")}
                placeholder={t("common.helpDesk.replyPlaceholder")}
                value={draft}
                maxLength={4000}
                onChange={(event) => setDraft(event.target.value)}
              />
              <Button isPending={sending} isDisabled={draft.trim().length < 2} onPress={() => void send()}>
                {t("common.helpDesk.sendReply")}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

export function SupportPage() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<SupportCategory>("billing");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);

  const load = useCallback(async () => {
    try {
      setTickets(await supportApi.fetchMyTickets());
    } catch {
      setTickets((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (message.trim().length < 10) {
      showToast(t("common.helpDesk.tooShort"), "danger");
      return;
    }
    setSending(true);
    try {
      const { code } = await supportApi.createTicket({ category, subject: subject.trim() || undefined, message: message.trim() });
      showToast(t("common.helpDesk.sent", { code }), "success");
      setSubject("");
      setMessage("");
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSending(false);
    }
  }

  const channels = [
    { label: t("common.helpDesk.channelBale"), value: `@${BALE_BOT}`, href: `https://ble.ir/${BALE_BOT}`, icon: Message2 },
    { label: t("common.helpDesk.channelTelegram"), value: `@${TELEGRAM_BOT}`, href: `https://t.me/${TELEGRAM_BOT}`, icon: DirectboxSend },
    { label: t("common.helpDesk.channelPhone"), value: toPersianDigits(SUPPORT_PHONE.replace("tel:", "")), href: SUPPORT_PHONE, icon: Call },
    { label: t("common.helpDesk.channelEmail"), value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, icon: Sms },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <PageHeader icon={<MessageQuestion size={24} variant="Bold" />} title={t("common.helpDesk.title")} description={t("common.helpDesk.description")} />

      <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/8 p-4">
        <Clock size={22} variant="Bold" className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="font-semibold">{t("common.helpDesk.responseTime")}</p>
          <p className="mt-0.5 text-sm text-muted">{t("common.helpDesk.responseTimeHint")}</p>
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-surface p-5">
        <h2 className="text-lg font-bold">{t("common.helpDesk.newTicket")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("common.helpDesk.category")}</span>
            <AppSelect
              ariaLabel={t("common.helpDesk.category")}
              value={category}
              onChange={(value) => setCategory(value as SupportCategory)}
              options={CATEGORIES.map((id) => ({ value: id, label: t(`common.helpDesk.categories.${id}`) }))}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">{t("common.helpDesk.subject")}</span>
            <Input variant="secondary" className="w-full" maxLength={120} placeholder={t("common.helpDesk.subjectPlaceholder")} value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("common.helpDesk.message")}</span>
          <TextArea variant="secondary" rows={5} className="w-full" maxLength={4000} placeholder={t("common.helpDesk.messagePlaceholder")} value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        {category === "billing" ? (
          <p className="flex items-start gap-2 text-xs leading-6 text-muted">
            <TickCircle size={16} variant="Bold" className="mt-0.5 shrink-0 text-success" />
            {t("common.helpDesk.paymentHelp")}
          </p>
        ) : null}
        <Button isPending={sending} onPress={() => void submit()}>
          <DirectboxSend size={18} />
          {t("common.helpDesk.send")}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">{t("common.helpDesk.myTickets")}</h2>
        {tickets === null ? null : tickets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/70 p-6 text-center text-sm text-muted">{t("common.helpDesk.noTickets")}</p>
        ) : (
          tickets.map((ticket) => <TicketCard key={ticket._id} ticket={ticket} onChanged={() => void load()} />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-muted">{t("common.helpDesk.channelsTitle")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <a key={channel.label} href={channel.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-border/60 bg-surface p-4 transition hover:border-accent/50">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <channel.icon size={20} variant="Bold" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs text-muted">{channel.label}</span>
                <span className="block truncate text-sm font-semibold" dir="ltr">{channel.value}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
