"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Button, Spinner, TextArea } from "@heroui/react";
import { CloseCircle, DocumentText, Paperclip2, Send2, TickCircle } from "iconsax-reactjs";

import {
  SUPPORT_ATTACHMENT_ACCEPT,
  SUPPORT_ATTACHMENT_MAX_BYTES,
  SUPPORT_MAX_ATTACHMENTS,
  supportAttachmentUrl,
  uploadSupportAttachment,
  type SupportAttachment,
  type SupportScope,
  type SupportThreadItem,
} from "@/common/api/support";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";

const timeFormatter = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" });
const dayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { weekday: "long", day: "numeric", month: "long" });

export function formatChatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : timeFormatter.format(date);
}

function dayKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (dayKey(value) === dayKey(today.toISOString())) return "امروز";
  if (dayKey(value) === dayKey(yesterday.toISOString())) return "دیروز";
  return dayFormatter.format(date);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${toPersianDigits(Math.round(bytes / 1024))} کیلوبایت`;
  return `${toPersianDigits((bytes / 1024 / 1024).toFixed(1))} مگابایت`;
}

/**
 * Runs `task` now and then every `intervalMs` while the tab is visible, and
 * right away when the tab becomes visible again. Near-real-time without sockets.
 */
export function usePolling(task: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const saved = useRef(task);
  useEffect(() => {
    saved.current = task;
  }, [task]);

  useEffect(() => {
    if (!enabled) return;
    let timer: number | null = null;
    const run = () => void saved.current();
    const start = () => {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(() => {
        if (document.visibilityState === "visible") run();
      }, intervalMs);
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    start();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [intervalMs, enabled]);
}

export function AttachmentView({ scope, file, compact = false }: { scope: SupportScope; file: SupportAttachment; compact?: boolean }) {
  const isImage = file.mime.startsWith("image/");
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isImage) return;
    let alive = true;
    supportAttachmentUrl(scope, file._id)
      .then((value) => alive && setUrl(value))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [file._id, isImage, scope]);

  async function open() {
    try {
      const href = url ?? (await supportAttachmentUrl(scope, file._id));
      const link = document.createElement("a");
      link.href = href;
      link.target = "_blank";
      link.rel = "noopener";
      if (!isImage && file.mime !== "application/pdf") link.download = file.name;
      link.click();
    } catch (error) {
      showErrorToast(error);
    }
  }

  if (isImage && !compact) {
    return (
      <button
        type="button"
        onClick={() => void open()}
        className="block overflow-hidden rounded-xl border border-border/50 bg-surface-secondary"
        aria-label={`نمایش ${file.name}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- private blob URL
          <img src={url} alt={file.name} className="max-h-56 w-auto max-w-full object-contain" />
        ) : (
          <span className="flex h-28 w-40 items-center justify-center text-xs text-muted">{failed ? "بارگذاری نشد" : <Spinner size="sm" />}</span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void open()}
      className="flex max-w-full items-center gap-2 rounded-xl border border-border/50 bg-surface/80 px-3 py-2 text-start text-xs transition hover:border-accent/50"
    >
      <DocumentText size={18} className="shrink-0 text-accent" />
      <span className="min-w-0">
        <span className="block truncate font-medium" dir="auto">{file.name}</span>
        <span className="block text-muted">{formatFileSize(file.size)}</span>
      </span>
    </button>
  );
}

/**
 * The conversation, oldest first. `viewer` decides which side is "mine":
 * the viewer's own messages sit on the start (right) side.
 */
export function ChatThread({
  items,
  scope,
  viewer,
  otherSeenAt,
  otherName,
  emptyHint,
}: {
  items: SupportThreadItem[];
  scope: SupportScope;
  viewer: "user" | "admin";
  /** When the other side last opened the conversation (for "seen" ticks). */
  otherSeenAt?: string | null;
  otherName: string;
  emptyHint?: ReactNode;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = items[items.length - 1]?._id;

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  if (!items.length) {
    return <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted">{emptyHint}</div>;
  }

  const seenAt = otherSeenAt ? new Date(otherSeenAt).getTime() : 0;
  const lastMine = [...items].reverse().find((item) => item.from === viewer && !item.internal);

  return (
    <div className="space-y-2.5 p-3 sm:p-4" aria-live="polite">
      {items.map((item, index) => {
        const mine = item.from === viewer;
        const showDay = index === 0 || dayKey(items[index - 1].at) !== dayKey(item.at);
        const who = item.internal
          ? `یادداشت داخلی${item.authorName ? ` · ${item.authorName}` : ""}`
          : mine
            ? viewer === "admin" && item.authorName
              ? item.authorName
              : "شما"
            : item.from === "admin"
              ? `پشتیبانی${item.authorName ? ` · ${item.authorName}` : ""}`
              : otherName;
        const bubble = item.internal
          ? "border border-dashed border-warning/60 bg-warning/10"
          : mine
            ? "bg-accent text-accent-foreground"
            : "border border-border/60 bg-surface-secondary";
        return (
          <Fragment key={item._id}>
            {showDay ? (
              <div className="flex justify-center py-1">
                <span className="rounded-full bg-surface-secondary px-3 py-0.5 text-[11px] text-muted">{dayLabel(item.at)}</span>
              </div>
            ) : null}
            <div className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2 text-sm leading-7 sm:max-w-[75%] ${bubble}`}>
                <p className={`text-[11px] font-semibold ${mine && !item.internal ? "text-accent-foreground/80" : "text-muted"}`}>{who}</p>
                {item.text ? <p className="whitespace-pre-wrap break-words" dir="auto">{item.text}</p> : null}
                {item.attachments?.length ? (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {item.attachments.map((file) => (
                      <AttachmentView key={file._id} scope={scope} file={file} />
                    ))}
                  </div>
                ) : null}
                <p className={`mt-0.5 flex items-center gap-1 text-[10px] ${mine && !item.internal ? "text-accent-foreground/70" : "text-muted"}`}>
                  {formatChatTime(item.at)}
                  {lastMine && item._id === lastMine._id && seenAt >= new Date(item.at).getTime() ? (
                    <span className="inline-flex items-center gap-0.5">
                      · <TickCircle size={11} variant="Bold" /> دیده شد
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </Fragment>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export function TypingNotice({ name }: { name: string | null }) {
  if (name === null) return null;
  return (
    <p className="px-4 pb-1 text-xs text-muted" aria-live="polite">
      <span className="inline-flex items-center gap-1">
        <span className="inline-flex gap-0.5">
          <i className="size-1 animate-bounce rounded-full bg-muted [animation-delay:-0.2s]" />
          <i className="size-1 animate-bounce rounded-full bg-muted [animation-delay:-0.1s]" />
          <i className="size-1 animate-bounce rounded-full bg-muted" />
        </span>
        {name ? `${name} در حال نوشتن…` : "در حال نوشتن…"}
      </span>
    </p>
  );
}

type PendingFile = { key: string; name: string; uploading: boolean; attachment?: SupportAttachment };

/** Uploads chosen/pasted/dropped files right away and tracks their ids for sending. */
export function useAttachmentUploads(scope: SupportScope) {
  const [files, setFiles] = useState<PendingFile[]>([]);

  const add = useCallback(
    async (list: FileList | File[]) => {
      const incoming = Array.from(list);
      if (!incoming.length) return;
      const room = SUPPORT_MAX_ATTACHMENTS - files.length;
      if (room <= 0) {
        showToast(`حداکثر ${toPersianDigits(SUPPORT_MAX_ATTACHMENTS)} فایل در هر پیام`, "danger");
        return;
      }
      for (const file of incoming.slice(0, room)) {
        if (file.size > SUPPORT_ATTACHMENT_MAX_BYTES) {
          showToast(`«${file.name}» بزرگ‌تر از ۵ مگابایت است`, "danger");
          continue;
        }
        const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
        setFiles((current) => [...current, { key, name: file.name, uploading: true }]);
        try {
          const attachment = await uploadSupportAttachment(scope, file);
          setFiles((current) => current.map((item) => (item.key === key ? { ...item, uploading: false, attachment } : item)));
        } catch (error) {
          setFiles((current) => current.filter((item) => item.key !== key));
          showErrorToast(error);
        }
      }
    },
    [files.length, scope],
  );

  const remove = useCallback((key: string) => setFiles((current) => current.filter((item) => item.key !== key)), []);
  const clear = useCallback(() => setFiles([]), []);
  const ids = files.flatMap((item) => (item.attachment ? [item.attachment._id] : []));
  const uploading = files.some((item) => item.uploading);

  return { files, add, remove, clear, ids, uploading };
}

export function PendingFiles({ uploads }: { uploads: ReturnType<typeof useAttachmentUploads> }) {
  if (!uploads.files.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {uploads.files.map((file) => (
        <span key={file.key} className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-border/60 bg-surface-secondary py-1 pe-1 ps-3 text-xs">
          {file.uploading ? <Spinner size="sm" /> : <Paperclip2 size={14} className="text-accent" />}
          <span className="truncate" dir="auto">{file.name}</span>
          <button type="button" aria-label={`حذف ${file.name}`} onClick={() => uploads.remove(file.key)} className="rounded-full p-0.5 text-muted hover:text-danger">
            <CloseCircle size={16} />
          </button>
        </span>
      ))}
    </div>
  );
}

export function AttachButton({ uploads, disabled }: { uploads: ReturnType<typeof useAttachmentUploads>; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={SUPPORT_ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          if (event.target.files) void uploads.add(event.target.files);
          event.target.value = "";
        }}
      />
      <Button isIconOnly variant="ghost" aria-label="پیوست فایل" isDisabled={disabled} onPress={() => inputRef.current?.click()}>
        <Paperclip2 size={20} />
      </Button>
    </>
  );
}

/**
 * Message box: Enter sends on desktop (Shift+Enter for a new line), Ctrl/⌘+Enter
 * everywhere. Files can be attached, pasted or dropped.
 */
export function Composer({
  scope,
  value,
  onChange,
  onSend,
  sending,
  placeholder,
  disabled,
  uploads,
  toolbar,
  sendLabel = "ارسال",
  tone = "default",
  onTyping,
}: {
  scope: SupportScope;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder: string;
  disabled?: boolean;
  uploads: ReturnType<typeof useAttachmentUploads>;
  toolbar?: ReactNode;
  sendLabel?: string;
  tone?: "default" | "note";
  /** Called while the user types (throttled by the caller). */
  onTyping?: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const canSend = !disabled && !sending && !uploads.uploading && (value.trim().length > 0 || uploads.ids.length > 0);

  return (
    <div
      className={`space-y-2 border-t p-3 transition ${tone === "note" ? "border-warning/40 bg-warning/5" : "border-border/50"} ${dragging ? "bg-accent/5" : ""}`}
      data-scope={scope}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled && event.dataTransfer.files.length) void uploads.add(event.dataTransfer.files);
      }}
    >
      {toolbar}
      <PendingFiles uploads={uploads} />
      <div className="flex items-end gap-2">
        <AttachButton uploads={uploads} disabled={disabled} />
        <TextArea
          variant="secondary"
          rows={2}
          className="max-h-48 min-h-[44px] w-full"
          aria-label={placeholder}
          placeholder={placeholder}
          value={value}
          maxLength={4000}
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
            onTyping?.();
          }}
          onPaste={(event) => {
            const pasted = Array.from(event.clipboardData.files);
            if (pasted.length) {
              event.preventDefault();
              void uploads.add(pasted);
            }
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            const coarse = window.matchMedia("(pointer: coarse)").matches;
            if (event.ctrlKey || event.metaKey || (!event.shiftKey && !coarse)) {
              event.preventDefault();
              if (canSend) onSend();
            }
          }}
        />
        <Button isIconOnly={false} isPending={sending} isDisabled={!canSend} onPress={onSend} aria-label={sendLabel}>
          <Send2 size={18} className="-scale-x-100" />
          <span className="hidden sm:inline">{sendLabel}</span>
        </Button>
      </div>
    </div>
  );
}
