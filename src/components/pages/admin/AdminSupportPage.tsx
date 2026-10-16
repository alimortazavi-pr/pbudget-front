"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Dropdown, Input, Label } from "@heroui/react";
import { Add, CloseSquare, ArrowRight2, Flash, Maximize4, MessageNotif, MessageText1, Messages2, Notification as NotificationIcon, Profile2User, Setting4, SidebarLeft, SidebarRight, Star1, TaskSquare, UserTick } from "iconsax-reactjs";

import * as supportApi from "@/common/api/support";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  type AdminTicketDetail,
  type AdminTicketList,
  type AdminTicketQuery,
  type SupportCannedReply,
  type SupportCategory,
  type SupportPriority,
  type SupportStatus,
} from "@/common/api/support";
import { notifySupportChanged } from "@/common/hooks/useSupportUnread";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { ChatThread, Composer, TypingNotice, formatChatTime, useAttachmentUploads, usePolling } from "@/components/pages/support/SupportChat";
import { useSupportEvent, useSupportRoom, useSupportSocket, useTypingIndicator, useTypingSender, type SupportChangeEvent } from "@/common/hooks/useSupportSocket";
import { AdminPageHeader, EmptyState, NativeSelect, PaginationBar, Pill, SearchField, SegmentedTabs, SkeletonRows, StatTile } from "./ui/AdminUi";
import { formatDateTimeFa, formatRelativeFa } from "./ui/admin-format";
import { AutoMessagesDialog, CannedRepliesDialog, StartConversationDialog } from "./support/SupportDialogs";
import { SupportUserContext } from "./support/SupportUserContext";
import { CATEGORY_LABEL, PRIORITY_LABEL, PRIORITY_TONE, SOURCE_LABEL, STATUS_LABEL, STATUS_TONE, fillCannedReply } from "./support/support-labels";

type Folder = "active" | "unread" | "mine" | "unassigned" | "closed" | "all";

function folderQuery(folder: Folder): Partial<AdminTicketQuery> {
  switch (folder) {
    case "unread":
      return { unread: true };
    case "mine":
      return { assignee: "me", status: "active" };
    case "unassigned":
      return { assignee: "none", status: "open" };
    case "closed":
      return { status: "closed" };
    case "all":
      return {};
    default:
      return { status: "active" };
  }
}

type InboxLayout = { full: boolean; list: boolean; context: boolean; filters: boolean };
const LAYOUT_KEY = "pdesk.admin-support.layout";
const DEFAULT_LAYOUT: InboxLayout = { full: false, list: true, context: true, filters: false };

/** Full screen and collapsed panels, remembered per admin on this device. */
function useInboxLayout() {
  const [layout, setLayout] = useState<InboxLayout>(DEFAULT_LAYOUT);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) ?? "null") as Partial<InboxLayout> | null;
      if (saved) setLayout({ ...DEFAULT_LAYOUT, ...saved });
    } catch {
      // Private mode or bad JSON: keep the defaults.
    }
  }, []);
  const toggle = useCallback((key: keyof InboxLayout) => {
    setLayout((current) => {
      const next = { ...current, [key]: !current[key] };
      try {
        window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);
  return { layout, toggle };
}

function readParam(name: string) {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function writeTicketParam(id: string | null) {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set("ticket", id);
  else url.searchParams.delete("ticket");
  url.searchParams.delete("compose");
  window.history.replaceState(window.history.state, "", url.toString());
}

function TagEditor({ tags, onSave }: { tags: string[]; onSave: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <button key={tag} type="button" onClick={() => onSave(tags.filter((item) => item !== tag))} className="rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] hover:line-through" title="حذف برچسب">
          #{tag}
        </button>
      ))}
      <Input
        aria-label="برچسب جدید"
        variant="secondary"
        className="h-7 w-28 text-xs"
        placeholder="+ برچسب"
        value={draft}
        maxLength={30}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && draft.trim()) {
            event.preventDefault();
            onSave([...tags, draft.trim()]);
            setDraft("");
          }
        }}
      />
    </div>
  );
}

function ConversationPane({
  ticket,
  admins,
  canned,
  onChanged,
  onBack,
  onOpenTicket,
  onManageCanned,
  showContext,
  onToggleContext,
}: {
  ticket: AdminTicketDetail;
  admins: { _id: string; name: string }[];
  canned: SupportCannedReply[];
  onChanged: (ticket: AdminTicketDetail) => void;
  onBack: () => void;
  onOpenTicket: (id: string) => void;
  onManageCanned: () => void;
  showContext: boolean;
  onToggleContext: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<"reply" | "note">(ticket.user ? "reply" : "note");
  const [sending, setSending] = useState(false);
  const uploads = useAttachmentUploads("admin");
  const drafts = useRef(new Map<string, string>());
  useSupportRoom(ticket._id);
  const sendTyping = useTypingSender(mode === "reply" ? ticket._id : null);
  const userTyping = useTypingIndicator(ticket._id, "user");

  // Keep an unsent draft per conversation while switching between them.
  useEffect(() => {
    setDraft(drafts.current.get(ticket._id) ?? "");
    setMode(ticket.user ? "reply" : "note");
    uploads.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the conversation changes
  }, [ticket._id]);

  function changeDraft(value: string) {
    drafts.current.set(ticket._id, value);
    setDraft(value);
  }

  async function update(payload: Parameters<typeof supportApi.adminUpdateTicket>[1], done?: string) {
    try {
      onChanged(await supportApi.adminUpdateTicket(ticket._id, payload));
      if (done) showToast(done, "success");
    } catch (error) {
      showErrorToast(error);
    }
  }

  async function send(close = false) {
    setSending(true);
    try {
      const next = await supportApi.adminReplyToTicket(ticket._id, {
        text: draft.trim() || undefined,
        attachmentIds: uploads.ids.length ? uploads.ids : undefined,
        internal: mode === "note",
        close: mode === "reply" && close,
      });
      drafts.current.delete(ticket._id);
      setDraft("");
      uploads.clear();
      onChanged(next);
      notifySupportChanged();
      showToast(mode === "note" ? "یادداشت داخلی ثبت شد" : close ? "پاسخ ارسال و گفتگو بسته شد" : "پاسخ ارسال شد", "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSending(false);
    }
  }

  function insertCanned(reply: SupportCannedReply) {
    const text = fillCannedReply(reply.text, ticket);
    changeDraft(draft.trim() ? `${draft.trimEnd()}\n${text}` : text);
    void supportApi.markCannedReplyUsed(reply._id).catch(() => undefined);
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedTabs
        size="sm"
        value={mode}
        onChange={(value) => setMode(value)}
        items={ticket.user ? [{ id: "reply", label: "پاسخ به کاربر" }, { id: "note", label: "یادداشت داخلی" }] : [{ id: "note", label: "یادداشت داخلی" }]}
      />
      <Dropdown>
        <Dropdown.Trigger className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-surface-secondary px-3 text-sm font-medium hover:bg-surface-tertiary">
          <MessageText1 size={16} />
          پاسخ آماده
        </Dropdown.Trigger>
        <Dropdown.Popover className="max-w-xs">
          <Dropdown.Menu
            aria-label="پاسخ‌های آماده"
            onAction={(key) => {
              if (key === "__manage") return onManageCanned();
              const reply = canned.find((item) => item._id === key);
              if (reply) insertCanned(reply);
            }}
          >
            {[
              ...canned.map((reply) => (
                <Dropdown.Item key={reply._id} id={reply._id} textValue={reply.title}>
                  <Label className="truncate">{reply.title}</Label>
                </Dropdown.Item>
              )),
              <Dropdown.Item key="__manage" id="__manage" textValue="مدیریت پاسخ‌های آماده">
                <Label className="text-accent">{canned.length ? "مدیریت پاسخ‌های آماده…" : "افزودن پاسخ آماده…"}</Label>
              </Dropdown.Item>,
            ]}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      {mode === "reply" && ticket.status !== "closed" ? (
        <Button size="sm" variant="ghost" isDisabled={sending || uploads.uploading || (!draft.trim() && !uploads.ids.length)} onPress={() => void send(true)}>
          <TaskSquare size={16} />
          ارسال و بستن
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-border/50 p-3">
        <div className="flex items-center gap-2">
          <Button isIconOnly size="sm" variant="ghost" aria-label="بازگشت" className="lg:hidden" onPress={onBack}>
            <ArrowRight2 size={18} />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">
              {ticket.name} <span className="text-xs font-normal text-muted" dir="ltr">{ticket.phone || ticket.email}</span>
            </p>
            <p className="truncate text-xs text-muted">
              <span dir="ltr">{ticket.code}</span> · {SOURCE_LABEL[ticket.source]} · {ticket.subject || CATEGORY_LABEL[ticket.category]} · {formatDateTimeFa(ticket.createdAt)}
            </p>
          </div>
          <Button size="sm" variant={showContext ? "secondary" : "ghost"} className="hidden lg:inline-flex" onPress={onToggleContext} aria-pressed={showContext}>
            <Profile2User size={16} />
            <span className="hidden xl:inline">اطلاعات کاربر</span>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <NativeSelect
            ariaLabel="وضعیت"
            value={ticket.status}
            onChange={(value) => void update({ status: value as SupportStatus }, "وضعیت تغییر کرد")}
            options={(["open", "answered", "closed"] as SupportStatus[]).map((id) => ({ value: id, label: STATUS_LABEL[id] }))}
          />
          <NativeSelect
            ariaLabel="اولویت"
            value={ticket.priority}
            onChange={(value) => void update({ priority: value as SupportPriority })}
            options={SUPPORT_PRIORITIES.map((id) => ({ value: id, label: `اولویت ${PRIORITY_LABEL[id]}` }))}
          />
          <NativeSelect
            ariaLabel="مسئول"
            value={ticket.assignedTo ?? ""}
            onChange={(value) => void update({ assignedTo: value || null }, value ? "گفتگو سپرده شد" : "مسئول برداشته شد")}
            options={[{ value: "", label: "بدون مسئول" }, ...admins.map((admin) => ({ value: admin._id, label: admin.name }))]}
          />
          <NativeSelect
            ariaLabel="موضوع"
            value={ticket.category}
            onChange={(value) => void update({ category: value as SupportCategory })}
            options={SUPPORT_CATEGORIES.map((id) => ({ value: id, label: CATEGORY_LABEL[id] }))}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TagEditor tags={ticket.tags} onSave={(tags) => void update({ tags })} />
          {ticket.rating ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted" title={ticket.ratingComment || undefined}>
              <Star1 size={14} variant="Bold" className="text-warning" /> امتیاز کاربر: {toPersianDigits(ticket.rating)} از ۵
              {ticket.ratingComment ? ` — «${ticket.ratingComment}»` : ""}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ChatThread items={ticket.thread} scope="admin" viewer="admin" otherSeenAt={ticket.userSeenAt} otherName={ticket.name} emptyHint="پیامی نیست" />
          </div>
          <TypingNotice name={userTyping} />
          <Composer
            scope="admin"
            value={draft}
            onChange={changeDraft}
            onSend={() => void send(false)}
            sending={sending}
            uploads={uploads}
            tone={mode === "note" ? "note" : "default"}
            toolbar={toolbar}
            placeholder={mode === "note" ? "یادداشت برای ادمین‌های دیگر (کاربر نمی‌بیند)…" : ticket.status === "closed" ? "پاسخ شما گفتگو را دوباره باز می‌کند…" : "پاسخ شما برای کاربر…"}
            sendLabel={mode === "note" ? "ثبت یادداشت" : "ارسال"}
            onTyping={sendTyping}
          />
        </div>
        {showContext ? (
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-s border-border/50 lg:block 2xl:w-80" aria-label="اطلاعات کاربر">
            <SupportUserContext ticket={ticket} onOpenTicket={onOpenTicket} />
          </aside>
        ) : null}
      </div>
      <details className="border-t border-border/50 lg:hidden">
        <summary className="cursor-pointer px-4 py-2 text-xs font-semibold text-muted">اطلاعات کاربر</summary>
        <SupportUserContext ticket={ticket} onOpenTicket={onOpenTicket} />
      </details>
    </div>
  );
}

export function AdminSupportPage() {
  const me = useAppSelector(userSelector);
  const [folder, setFolder] = useState<Folder>("active");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<"" | SupportPriority>("");
  const [category, setCategory] = useState<"" | SupportCategory>("");
  const [source, setSource] = useState<"" | "landing" | "app" | "admin" | "system">("");
  const [sort, setSort] = useState<"" | "oldest" | "priority">("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminTicketList | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<AdminTicketDetail | null>(null);
  const [admins, setAdmins] = useState<{ _id: string; name: string }[]>([]);
  const [canned, setCanned] = useState<SupportCannedReply[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeUser, setComposeUser] = useState<{ _id: string; name: string; mobile: string } | null>(null);
  const [cannedOpen, setCannedOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const { layout, toggle } = useInboxLayout();
  const live = useSupportSocket();
  const [notifyGranted, setNotifyGranted] = useState(false);
  const pulse = useRef<{ stamp: string | null; unread: number } | null>(null);

  const query = useMemo<AdminTicketQuery>(
    () => ({ ...folderQuery(folder), search, priority, category, source, sort, page }),
    [folder, search, priority, category, source, sort, page],
  );

  const loadList = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setData(await supportApi.fetchAdminTickets(query));
    } catch (error) {
      if (!quiet) showErrorToast(error);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [query]);

  const loadListRef = useRef(loadList);
  useEffect(() => {
    loadListRef.current = loadList;
  }, [loadList]);

  const loadTicket = useCallback(async (id: string) => {
    try {
      const detail = await supportApi.fetchAdminTicket(id);
      setTicket(detail);
      if (detail.unreadByAdmin) {
        await supportApi.adminMarkTicketRead(id);
        notifySupportChanged();
        setData((current) => current && { ...current, items: current.items.map((item) => (item._id === id ? { ...item, unreadByAdmin: false } : item)) });
        void loadListRef.current(true);
      }
    } catch (error) {
      showErrorToast(error);
    }
  }, []);

  const loadCanned = useCallback(() => {
    void supportApi.fetchCannedReplies().then(setCanned).catch(() => undefined);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void supportApi.fetchSupportAdmins().then(setAdmins).catch(() => undefined);
    loadCanned();
    setNotifyGranted(typeof Notification !== "undefined" && Notification.permission === "granted");
    const wanted = readParam("ticket");
    if (wanted) setSelectedId(wanted);
    const composeFor = readParam("compose");
    if (composeFor) {
      setComposeUser({ _id: composeFor, name: readParam("name") || "کاربر", mobile: readParam("mobile") || "" });
      setComposeOpen(true);
    }
  }, [loadCanned]);

  useEffect(() => {
    if (selectedId) void loadTicket(selectedId);
    else setTicket(null);
  }, [selectedId, loadTicket]);

  // Unread count in the tab title, so a background tab shows new messages.
  useEffect(() => {
    const unread = data?.summary.unread ?? 0;
    const base = "پشتیبانی — پنل ادمین";
    document.title = unread ? `(${toPersianDigits(unread)}) ${base}` : base;
  }, [data?.summary.unread]);

  const selectedRef = useRef(selectedId);
  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  // Live over socket.io: refresh the list, the open conversation, and alert on new user messages.
  useSupportEvent<SupportChangeEvent>("support:changed", (event) => {
    void loadListRef.current(true);
    if (event.ticketId === selectedRef.current) {
      // loadTicket also marks it read when the admin is looking at it.
      if (document.visibilityState === "visible") void loadTicket(event.ticketId);
      else void supportApi.fetchAdminTicket(event.ticketId).then(setTicket).catch(() => undefined);
    }
    if (event.by === "user" && (event.kind === "message" || event.kind === "created")) {
      notifySupportChanged();
      if (event.ticketId !== selectedRef.current || document.visibilityState !== "visible") {
        showToast("پیام تازه‌ای در پشتیبانی رسید", "success");
      }
      if (document.visibilityState !== "visible" && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("پیام جدید پشتیبانی", { body: "یک گفتگو منتظر پاسخ است", tag: "pdesk-support" });
      }
    }
  });
  useSupportEvent("support:read", (event: { ticketId: string }) => {
    if (event.ticketId === selectedRef.current) {
      void supportApi.fetchAdminTicket(event.ticketId).then(setTicket).catch(() => undefined);
    }
  });

  // Fallback when the socket is down: a cheap pulse every 8s (every 45s while live).
  const poll = useCallback(async () => {
    try {
      const next = await supportApi.fetchAdminSupportPulse();
      const previous = pulse.current;
      pulse.current = { stamp: next.stamp, unread: next.unread };
      if (!previous || previous.stamp === next.stamp) return;
      if (next.unread > previous.unread) {
        showToast("پیام تازه‌ای در پشتیبانی رسید", "success");
        if (document.visibilityState !== "visible" && typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("پیام جدید پشتیبانی", { body: "یک گفتگو منتظر پاسخ است", tag: "pdesk-support" });
        }
      }
      await loadList(true);
      if (selectedId) {
        const detail = await supportApi.fetchAdminTicket(selectedId);
        setTicket(detail);
      }
    } catch {
      // Try again on the next tick.
    }
  }, [loadList, selectedId]);
  usePolling(poll, live ? 45_000 : 8_000);

  // Esc leaves full screen.
  useEffect(() => {
    if (!layout.full) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !document.querySelector("[role=dialog]")) toggle("full");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layout.full, toggle]);

  function select(id: string | null) {
    setSelectedId(id);
    writeTicketParam(id);
  }

  function applyTicket(next: AdminTicketDetail) {
    setTicket(next);
    void loadList(true);
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") return showToast("مرورگر شما از اعلان پشتیبانی نمی‌کند", "danger");
    const permission = await Notification.requestPermission();
    setNotifyGranted(permission === "granted");
    if (permission === "granted") showToast("اعلان پیام‌های تازه روشن شد", "success");
  }

  const summary = data?.summary;
  const changeFolder = (value: Folder) => {
    setFolder(value);
    setPage(1);
  };

  const activeFilters = [priority, category, source, sort].filter(Boolean).length;
  const headerActions = (
    <>
      {!notifyGranted ? (
        <Button variant="ghost" size="sm" onPress={() => void enableNotifications()}>
          <NotificationIcon size={16} />
          اعلان مرورگر
        </Button>
      ) : null}
      <Button variant="ghost" size="sm" onPress={() => setAutoOpen(true)}>
        <MessageNotif size={16} />
        پیام‌های خودکار
      </Button>
      <Button variant="secondary" size="sm" onPress={() => setCannedOpen(true)}>
        <MessageText1 size={16} />
        پاسخ‌های آماده
      </Button>
      <Button size="sm" onPress={() => { setComposeUser(null); setComposeOpen(true); }}>
        <Add size={16} />
        گفتگوی جدید
      </Button>
    </>
  );

  const listPanel = layout.list ? (
    <aside className={`min-h-0 flex-col border-border/50 lg:flex lg:border-e ${ticket ? "hidden" : "flex"}`} aria-label="فهرست گفتگوها">
      <div className="space-y-2 border-b border-border/50 p-3">
        <div className="flex items-center gap-2">
          <SearchField className="min-w-0 flex-1" value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="جستجو در کد، نام، موبایل، متن…" />
          <Button isIconOnly size="sm" variant={layout.filters || activeFilters ? "secondary" : "ghost"} aria-label="فیلترها" aria-pressed={layout.filters} onPress={() => toggle("filters")} className="relative">
            <Setting4 size={18} />
            {activeFilters ? <span className="absolute -end-1 -top-1 rounded-full bg-accent px-1 text-[10px] text-accent-foreground">{toPersianDigits(activeFilters)}</span> : null}
          </Button>
        </div>
        <SegmentedTabs
          size="sm"
          value={folder}
          onChange={changeFolder}
          items={[
            { id: "active", label: "فعال", count: summary ? summary.open + summary.answered : undefined },
            { id: "unread", label: "خوانده‌نشده", count: summary?.unread },
            { id: "mine", label: "مال من", count: summary?.mine },
            { id: "unassigned", label: "بی‌مسئول", count: summary?.unassigned },
            { id: "closed", label: "بسته" },
            { id: "all", label: "همه" },
          ]}
        />
        {layout.filters ? (
          <div className="grid grid-cols-2 gap-2">
            <NativeSelect ariaLabel="اولویت" value={priority} onChange={(value) => { setPriority(value as "" | SupportPriority); setPage(1); }} options={[{ value: "", label: "همهٔ اولویت‌ها" }, ...SUPPORT_PRIORITIES.map((id) => ({ value: id, label: PRIORITY_LABEL[id] }))]} />
            <NativeSelect ariaLabel="موضوع" value={category} onChange={(value) => { setCategory(value as "" | SupportCategory); setPage(1); }} options={[{ value: "", label: "همهٔ موضوع‌ها" }, ...SUPPORT_CATEGORIES.map((id) => ({ value: id, label: CATEGORY_LABEL[id] }))]} />
            <NativeSelect ariaLabel="منبع" value={source} onChange={(value) => { setSource(value as "" | "landing" | "app" | "admin" | "system"); setPage(1); }} options={[{ value: "", label: "همهٔ منابع" }, { value: "app", label: "اپ" }, { value: "landing", label: "فرم سایت" }, { value: "admin", label: "شروع‌شده توسط ادمین" }, { value: "system", label: "پیام خودکار" }]} />
            <NativeSelect ariaLabel="مرتب‌سازی" value={sort} onChange={(value) => setSort(value as "" | "oldest" | "priority")} options={[{ value: "", label: "تازه‌ترین" }, { value: "priority", label: "اولویت" }, { value: "oldest", label: "قدیمی‌ترین" }]} />
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading && !data ? (
          <div className="p-3">
            <SkeletonRows rows={6} />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="گفتگویی پیدا نشد" description={folder === "active" ? "همهٔ گفتگوها پاسخ داده یا بسته شده‌اند." : undefined} />
        ) : (
          <ul>
            {data.items.map((item) => {
              const assignee = item.assignedTo ? admins.find((admin) => admin._id === item.assignedTo)?.name : null;
              return (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => select(item._id)}
                    aria-current={item._id === selectedId ? "true" : undefined}
                    className={`flex w-full flex-col gap-1 border-b border-border/40 px-3 py-2.5 text-start transition hover:bg-surface-secondary ${item._id === selectedId ? "bg-accent/8" : ""}`}
                  >
                    <span className="flex items-center gap-2">
                      {item.unreadByAdmin ? <span className="size-2 shrink-0 rounded-full bg-danger" aria-label="خوانده‌نشده" /> : null}
                      <span className={`min-w-0 flex-1 truncate text-sm ${item.unreadByAdmin ? "font-bold" : "font-semibold"}`}>{item.name}</span>
                      <span className="shrink-0 text-[11px] text-muted" title={formatDateTimeFa(item.lastActivityAt)}>
                        {formatRelativeFa(item.lastActivityAt)}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted" dir="auto">
                      {item.subject ? <span className="font-medium text-foreground/80">{item.subject} — </span> : null}
                      {item.lastMessage ? `${item.lastMessage.from === "admin" ? "شما: " : ""}${item.lastMessage.text || "📎 فایل"}` : ""}
                    </span>
                    <span className="flex flex-wrap items-center gap-1">
                      <Pill tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Pill>
                      {item.priority !== "normal" ? <Pill tone={PRIORITY_TONE[item.priority]}>{PRIORITY_LABEL[item.priority]}</Pill> : null}
                      {item.automated ? <Pill tone="info">خودکار</Pill> : null}
                      {item.source === "landing" ? <Pill tone="info">سایت</Pill> : null}
                      {assignee ? <span className="text-[11px] text-muted">· {assignee}</span> : null}
                      {item.assignedTo && item.assignedTo === me?._id ? <span className="text-[11px] text-accent">(من)</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-border/50 px-3 py-2">
        <PaginationBar pagination={data?.pagination} onPage={setPage} />
      </div>
    </aside>
  ) : (
    <aside className={`min-h-0 flex-col items-center gap-2 border-border/50 py-3 lg:flex lg:border-e ${ticket ? "hidden" : "flex"}`} aria-label="فهرست گفتگوها (جمع‌شده)">
      <Button isIconOnly size="sm" variant="ghost" aria-label="نمایش فهرست گفتگوها" onPress={() => toggle("list")}>
        <SidebarRight size={18} />
      </Button>
      {summary?.unread ? (
        <span className="rounded-full bg-danger px-1.5 text-[11px] font-bold text-white" title="خوانده‌نشده">{toPersianDigits(summary.unread)}</span>
      ) : null}
    </aside>
  );

  const inbox = (
    <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface ${layout.full ? "flex-1" : "lg:h-[calc(100dvh-200px)] lg:min-h-[560px]"}`}>
      <div className="flex items-center gap-1 border-b border-border/50 px-2 py-1.5">
        <Button isIconOnly size="sm" variant="ghost" className="hidden lg:inline-flex" aria-label={layout.list ? "جمع کردن فهرست" : "نمایش فهرست"} aria-pressed={layout.list} onPress={() => toggle("list")}>
          <SidebarRight size={18} />
        </Button>
        <span className="flex items-center gap-1.5 px-1 text-xs text-muted" title={live ? "به‌روزرسانی زنده فعال است" : "اتصال زنده برقرار نیست؛ هر چند ثانیه به‌روز می‌شود"}>
          <span className={`size-2 rounded-full ${live ? "bg-success" : "bg-warning"}`} />
          {live ? "زنده" : "در حال اتصال…"}
        </span>
        <span className="flex-1" />
        <Button isIconOnly size="sm" variant="ghost" className="hidden lg:inline-flex" aria-label={layout.context ? "جمع کردن اطلاعات کاربر" : "نمایش اطلاعات کاربر"} aria-pressed={layout.context} onPress={() => toggle("context")}>
          <SidebarLeft size={18} />
        </Button>
        <Button isIconOnly size="sm" variant="ghost" aria-label={layout.full ? "خروج از تمام‌صفحه" : "تمام‌صفحه"} onPress={() => toggle("full")}>
          {layout.full ? <CloseSquare size={18} /> : <Maximize4 size={18} />}
        </Button>
      </div>
      <div className={`grid min-h-0 flex-1 ${layout.list ? "lg:grid-cols-[minmax(280px,340px)_1fr]" : "lg:grid-cols-[48px_1fr]"}`}>
        {listPanel}
        <section className={`min-h-[70dvh] lg:block lg:min-h-0 ${ticket ? "block" : "hidden"}`}>
          {ticket ? (
            <ConversationPane
              ticket={ticket}
              admins={admins}
              canned={canned}
              onChanged={applyTicket}
              onBack={() => select(null)}
              onOpenTicket={(id) => select(id)}
              onManageCanned={() => setCannedOpen(true)}
              showContext={layout.context}
              onToggleContext={() => toggle("context")}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted">
              <Messages2 size={40} className="text-accent/60" />
              <p>یک گفتگو را انتخاب کنید.</p>
              {summary?.unread ? <p className="text-xs">{toPersianDigits(summary.unread)} گفتگو منتظر خواندن است.</p> : null}
              {data?.items[0] ? <p className="text-xs">آخرین پیام: {formatChatTime(data.items[0].lastActivityAt)}</p> : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {layout.full ? (
        createPortal(
        <div className="fixed inset-0 z-[60] flex flex-col gap-2 bg-background p-2 sm:p-3" role="region" aria-label="پشتیبانی — تمام‌صفحه">
          <div className="flex flex-wrap items-center gap-2 px-1">
            <Messages2 size={20} variant="Bold" className="text-accent" />
            <span className="font-bold">پشتیبانی</span>
            <Pill tone={summary?.unread ? "danger" : "neutral"}>{toPersianDigits(summary?.unread ?? 0)} خوانده‌نشده</Pill>
            <Pill tone={summary?.open ? "warning" : "neutral"}>{toPersianDigits(summary?.open ?? 0)} در انتظار</Pill>
            <span className="flex-1" />
            <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
          </div>
          {inbox}
        </div>,
        document.body,
        )
      ) : (
        <>
          <AdminPageHeader
            title="پشتیبانی"
            description="گفتگو با کاربران، زنده و یک‌جا: پاسخ، یادداشت داخلی، سپردن، اولویت، پاسخ آماده و پیام‌های خودکار."
            icon={<Messages2 size={22} variant="Bold" />}
            actions={headerActions}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <StatTile label="خوانده‌نشده" value={summary?.unread ?? 0} tone={summary?.unread ? "danger" : "success"} icon={<NotificationIcon size={20} />} />
            <StatTile label="در انتظار پاسخ" value={summary?.open ?? 0} tone={summary?.open ? "warning" : "success"} icon={<Messages2 size={20} />} />
            <StatTile label="سپرده به من" value={summary?.mine ?? 0} tone="accent" icon={<UserTick size={20} />} />
            <StatTile label="بدون مسئول" value={summary?.unassigned ?? 0} tone={summary?.unassigned ? "warning" : "neutral"} icon={<Profile2User size={20} />} />
            <StatTile label="فوری و مهم" value={summary?.urgent ?? 0} tone={summary?.urgent ? "danger" : "neutral"} icon={<Flash size={20} />} />
            <StatTile
              label="رضایت کاربران"
              value={summary?.ratingAverage != null ? `${toPersianDigits(summary.ratingAverage)} از ۵` : "—"}
              hint={summary?.ratingCount ? `${toPersianDigits(summary.ratingCount)} امتیاز` : undefined}
              tone="info"
              icon={<Star1 size={20} />}
            />
          </div>

          {inbox}
        </>
      )}

      <StartConversationDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        initialUser={composeUser}
        onStarted={(started) => {
          setFolder("all");
          void loadList(true);
          select(started._id);
        }}
      />
      <CannedRepliesDialog open={cannedOpen} onOpenChange={setCannedOpen} replies={canned} onChanged={loadCanned} />
      <AutoMessagesDialog open={autoOpen} onOpenChange={setAutoOpen} />
    </div>
  );
}
