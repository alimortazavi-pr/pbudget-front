"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip, Input, TextArea } from "@heroui/react";
import { Add, ArrowRight2, Call, Clock, DirectboxSend, Message2, MessageQuestion, Sms, Star1, TickCircle } from "iconsax-reactjs";

import * as supportApi from "@/common/api/support";
import { SUPPORT_CATEGORIES, type SupportCategory, type SupportStatus, type SupportTicket } from "@/common/api/support";
import { CONTACT_EMAIL } from "@/common/constants/brand";
import { toPersianDigits } from "@/common/utils";
import { SUPPORT_PHONE } from "@/components/common/layout/shell-nav";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppSelect } from "@/components/common/form/AppControls";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { notifySupportChanged } from "@/common/hooks/useSupportUnread";
import { useTranslation } from "@/i18n";
import { AttachButton, ChatThread, Composer, PendingFiles, formatChatTime, useAttachmentUploads, usePolling } from "./SupportChat";

const STATUS_COLOR: Record<SupportStatus, "warning" | "success" | "default"> = {
  open: "warning",
  answered: "success",
  closed: "default",
};
const TELEGRAM_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") || "paradisebudget_bot";
const BALE_BOT = "paradisedesk_bot";

function readTicketParam() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("ticket");
}

function writeTicketParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("ticket", id);
  else url.searchParams.delete("ticket");
  window.history.replaceState(window.history.state, "", url.toString());
}

function NewTicketForm({ onCreated, onCancel }: { onCreated: (id: string) => void; onCancel?: () => void }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<SupportCategory>("billing");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const uploads = useAttachmentUploads("user");

  async function submit() {
    if (message.trim().length < 10) {
      showToast(t("common.helpDesk.tooShort"), "danger");
      return;
    }
    setSending(true);
    try {
      const { id, code } = await supportApi.createTicket({
        category,
        subject: subject.trim() || undefined,
        message: message.trim(),
        attachmentIds: uploads.ids.length ? uploads.ids : undefined,
      });
      showToast(t("common.helpDesk.sent", { code }), "success");
      setSubject("");
      setMessage("");
      uploads.clear();
      onCreated(id);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className="space-y-4 p-4 sm:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">{t("common.helpDesk.newTicket")}</h2>
        {onCancel ? (
          <Button size="sm" variant="ghost" onPress={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("common.helpDesk.category")}</span>
          <AppSelect
            ariaLabel={t("common.helpDesk.category")}
            value={category}
            onChange={(value) => setCategory(value as SupportCategory)}
            options={SUPPORT_CATEGORIES.map((id) => ({ value: id, label: t(`common.helpDesk.categories.${id}`) }))}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">{t("common.helpDesk.subject")}</span>
          <Input variant="secondary" className="w-full" maxLength={120} placeholder={t("common.helpDesk.subjectPlaceholder")} value={subject} onChange={(event) => setSubject(event.target.value)} />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">{t("common.helpDesk.message")}</span>
        <TextArea
          variant="secondary"
          rows={5}
          className="w-full"
          maxLength={4000}
          placeholder={t("common.helpDesk.messagePlaceholder")}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onPaste={(event) => {
            const pasted = Array.from(event.clipboardData.files);
            if (pasted.length) {
              event.preventDefault();
              void uploads.add(pasted);
            }
          }}
        />
      </label>
      <PendingFiles uploads={uploads} />
      {category === "billing" ? (
        <p className="flex items-start gap-2 text-xs leading-6 text-muted">
          <TickCircle size={16} variant="Bold" className="mt-0.5 shrink-0 text-success" />
          {t("common.helpDesk.paymentHelp")}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" isPending={sending} isDisabled={uploads.uploading}>
          <DirectboxSend size={18} />
          {t("common.helpDesk.send")}
        </Button>
        <AttachButton uploads={uploads} />
        <span className="text-xs text-muted">{t("common.helpDesk.attachHint")}</span>
      </div>
    </form>
  );
}

function RatingBox({ ticket, onRated }: { ticket: SupportTicket; onRated: (ticket: SupportTicket) => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(ticket.rating ?? 0);
  const [comment, setComment] = useState(ticket.ratingComment ?? "");
  const [busy, setBusy] = useState(false);
  const answered = ticket.startedBy === "admin" || ticket.thread.some((item) => item.from === "admin");
  if (!answered) return null;

  async function save(rating: number) {
    setValue(rating);
    setBusy(true);
    try {
      onRated(await supportApi.rateTicket(ticket._id, rating, comment.trim() || undefined));
      showToast(t("common.helpDesk.rated"), "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-3">
      <p className="text-sm font-semibold">{t("common.helpDesk.rateTitle")}</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={t("common.helpDesk.rateTitle")}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={toPersianDigits(star)}
            disabled={busy}
            onClick={() => void save(star)}
            className={`rounded-lg p-1 transition ${star <= value ? "text-warning" : "text-muted hover:text-warning"}`}
          >
            <Star1 size={24} variant={star <= value ? "Bold" : "Linear"} />
          </button>
        ))}
      </div>
      {value ? (
        <div className="flex items-end gap-2">
          <Input variant="secondary" className="w-full" maxLength={500} placeholder={t("common.helpDesk.rateComment")} value={comment} onChange={(event) => setComment(event.target.value)} />
          <Button size="sm" variant="secondary" isPending={busy} onPress={() => void save(value)}>
            {t("common.save")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Conversation({ ticket, onBack, onChanged }: { ticket: SupportTicket; onBack: () => void; onChanged: (ticket: SupportTicket) => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const uploads = useAttachmentUploads("user");

  async function send() {
    setSending(true);
    try {
      onChanged(await supportApi.replyToTicket(ticket._id, { text: draft.trim() || undefined, attachmentIds: uploads.ids.length ? uploads.ids : undefined }));
      setDraft("");
      uploads.clear();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSending(false);
    }
  }

  async function close() {
    setClosing(true);
    try {
      onChanged(await supportApi.closeMyTicket(ticket._id));
      showToast(t("common.helpDesk.closedToast"), "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-border/50 p-3">
        <Button isIconOnly size="sm" variant="ghost" aria-label={t("common.back")} className="lg:hidden" onPress={onBack}>
          <ArrowRight2 size={18} />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{ticket.subject || t(`common.helpDesk.categories.${ticket.category}`)}</p>
          <p className="truncate text-xs text-muted">
            <span dir="ltr">{ticket.code}</span> · {t(`common.helpDesk.categories.${ticket.category}`)}
          </p>
        </div>
        <Chip size="sm" color={STATUS_COLOR[ticket.status]}>{t(`common.helpDesk.status.${ticket.status}`)}</Chip>
        {ticket.status !== "closed" ? (
          <Button size="sm" variant="ghost" isPending={closing} onPress={() => void close()}>
            {t("common.helpDesk.closeConversation")}
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ChatThread items={ticket.thread} scope="user" viewer="user" otherSeenAt={ticket.adminSeenAt} otherName={t("common.helpDesk.team")} />
      </div>
      {ticket.status === "closed" ? (
        <div className="space-y-3 border-t border-border/50 p-3">
          <p className="text-xs text-muted">{t("common.helpDesk.closedNote")}</p>
          <RatingBox ticket={ticket} onRated={onChanged} />
        </div>
      ) : (
        <>
          {ticket.status === "answered" && ticket.rating == null ? (
            <div className="px-3 pt-3">
              <RatingBox ticket={ticket} onRated={onChanged} />
            </div>
          ) : null}
          <Composer
            scope="user"
            value={draft}
            onChange={setDraft}
            onSend={() => void send()}
            sending={sending}
            uploads={uploads}
            placeholder={t("common.helpDesk.replyPlaceholder")}
            sendLabel={t("common.helpDesk.sendReply")}
          />
        </>
      )}
    </div>
  );
}

export function SupportPage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const stamp = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await supportApi.fetchMyTickets();
      setTickets(list);
      return list;
    } catch {
      setTickets((current) => current ?? []);
      return null;
    }
  }, []);

  useEffect(() => {
    void load().then((list) => {
      const wanted = readTicketParam();
      if (wanted && list?.some((item) => item._id === wanted)) setSelectedId(wanted);
      else if (list && list.length === 0) setComposing(true);
    });
  }, [load]);

  // Near-real-time: a cheap pulse every 10s; the list reloads only when something changed.
  const poll = useCallback(async () => {
    try {
      const pulse = await supportApi.fetchSupportPulse();
      if (stamp.current && pulse.stamp !== stamp.current) await load();
      stamp.current = pulse.stamp;
    } catch {
      // Offline or signed out; try again on the next tick.
    }
  }, [load]);
  usePolling(poll, 10_000);

  const selected = useMemo(() => tickets?.find((item) => item._id === selectedId) ?? null, [tickets, selectedId]);

  useEffect(() => {
    if (!selected?.unreadByUser) return;
    void supportApi
      .markTicketRead(selected._id)
      .then(() => {
        setTickets((current) => current?.map((item) => (item._id === selected._id ? { ...item, unreadByUser: false } : item)) ?? current);
        notifySupportChanged();
      })
      .catch(() => undefined);
  }, [selected]);

  function select(id: string | null) {
    setSelectedId(id);
    setComposing(false);
    writeTicketParam(id);
  }

  function replace(ticket: SupportTicket) {
    setTickets((current) => {
      const rest = (current ?? []).filter((item) => item._id !== ticket._id);
      return [ticket, ...rest].sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
    });
  }

  const channels = [
    { label: t("common.helpDesk.channelBale"), value: `@${BALE_BOT}`, href: `https://ble.ir/${BALE_BOT}`, icon: Message2 },
    { label: t("common.helpDesk.channelTelegram"), value: `@${TELEGRAM_BOT}`, href: `https://t.me/${TELEGRAM_BOT}`, icon: DirectboxSend },
    { label: t("common.helpDesk.channelPhone"), value: toPersianDigits(SUPPORT_PHONE.replace("tel:", "")), href: SUPPORT_PHONE, icon: Call },
    { label: t("common.helpDesk.channelEmail"), value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}`, icon: Sms },
  ];

  const showPane = composing || Boolean(selected);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5">
      <PageHeader
        icon={<MessageQuestion size={24} variant="Bold" />}
        title={t("common.helpDesk.title")}
        description={t("common.helpDesk.description")}
        actions={
          <Button onPress={() => { setComposing(true); setSelectedId(null); writeTicketParam(null); }} data-tour="support-new">
            <Add size={18} />
            {t("common.helpDesk.newConversation")}
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/8 p-4">
        <Clock size={22} variant="Bold" className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="font-semibold">{t("common.helpDesk.responseTime")}</p>
          <p className="mt-0.5 text-sm text-muted">{t("common.helpDesk.responseTimeHint")}</p>
        </div>
      </div>

      <div className="grid overflow-hidden rounded-2xl border border-border/60 bg-surface lg:h-[min(72dvh,760px)] lg:grid-cols-[320px_1fr]" data-tour="support-inbox">
        <aside className={`min-h-0 border-border/50 lg:block lg:overflow-y-auto lg:border-e ${showPane ? "hidden" : "block"}`} aria-label={t("common.helpDesk.myTickets")}>
          <h2 className="border-b border-border/50 px-4 py-3 text-sm font-bold">{t("common.helpDesk.myTickets")}</h2>
          {tickets === null ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2].map((key) => (
                <div key={key} className="h-16 animate-pulse rounded-xl bg-surface-secondary" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">{t("common.helpDesk.noTickets")}</p>
          ) : (
            <ul>
              {tickets.map((ticket) => (
                <li key={ticket._id}>
                  <button
                    type="button"
                    onClick={() => select(ticket._id)}
                    aria-current={ticket._id === selectedId ? "true" : undefined}
                    className={`flex w-full flex-col gap-1 border-b border-border/40 px-4 py-3 text-start transition hover:bg-surface-secondary ${ticket._id === selectedId ? "bg-accent/8" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {ticket.unreadByUser ? <span className="size-2 shrink-0 rounded-full bg-accent" aria-label={t("common.helpDesk.newReply")} /> : null}
                      <span className={`min-w-0 flex-1 truncate text-sm ${ticket.unreadByUser ? "font-bold" : "font-semibold"}`}>
                        {ticket.subject || t(`common.helpDesk.categories.${ticket.category}`)}
                      </span>
                      <span className="shrink-0 text-[11px] text-muted">{formatChatTime(ticket.lastActivityAt)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs text-muted" dir="auto">
                        {ticket.lastMessage ? `${ticket.lastMessage.from === "admin" ? `${t("common.helpDesk.team")}: ` : ""}${ticket.lastMessage.text || "📎"}` : ""}
                      </span>
                      <Chip size="sm" color={STATUS_COLOR[ticket.status]}>{t(`common.helpDesk.status.${ticket.status}`)}</Chip>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className={`min-h-[60dvh] lg:block lg:min-h-0 ${showPane ? "block" : "hidden"}`}>
          {composing ? (
            <div className="h-full overflow-y-auto">
              <NewTicketForm
                onCancel={tickets?.length ? () => setComposing(false) : undefined}
                onCreated={(id) => {
                  void load().then(() => select(id));
                }}
              />
            </div>
          ) : selected ? (
            <Conversation ticket={selected} onBack={() => select(null)} onChanged={replace} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted">
              <MessageQuestion size={40} className="text-accent/60" />
              <p>{t("common.helpDesk.pickConversation")}</p>
              <Button variant="secondary" onPress={() => setComposing(true)}>
                <Add size={18} />
                {t("common.helpDesk.newConversation")}
              </Button>
            </div>
          )}
        </section>
      </div>

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
