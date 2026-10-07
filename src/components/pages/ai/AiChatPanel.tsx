"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Skeleton, TextArea } from "@heroui/react";
import { Copy, Magicpen, MessageText1, Send2, TickCircle } from "iconsax-reactjs";

import { sendAiChat } from "@/common/api/ai";
import type { AiChatMessage, AiStatus } from "@/common/interfaces/ai.interface";
import { showErrorToast } from "@/common/utils/toast";
import { AiRichText } from "@/components/pages/ai/AiRichText";
import { useTranslation } from "@/components/providers/LanguageProvider";

const STORAGE_KEY = "pb-ai-chat-v2";
const MAX_STORED = 24;

interface ChatEntry extends AiChatMessage {
  followUps?: string[];
}

function loadMessages(): ChatEntry[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatEntry[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED) : [];
  } catch {
    return [];
  }
}

export function AiChatPanel({ enabled, onStatus }: { enabled: boolean; onStatus: (status: AiStatus) => void }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(loadMessages());
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* private mode */
    }
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy, restored]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !enabled) return;
    const next: ChatEntry[] = [...messages.map(({ role, text: body }) => ({ role, text: body })), { role: "user", text: content }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      const response = await sendAiChat(next);
      setMessages([...next, { role: "assistant", text: response.reply, followUps: response.followUps }]);
      onStatus(response.status);
    } catch (error) {
      // Keep the question so it can be sent again.
      setMessages(next.slice(0, -1));
      setDraft(content);
      showErrorToast(error, t("common.ai.errorGeneric"));
    } finally {
      setBusy(false);
    }
  }

  async function copy(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      /* clipboard unavailable */
    }
  }

  const quick = [t("common.ai.quick1"), t("common.ai.quick2"), t("common.ai.quick3"), t("common.ai.quick4")];
  const lastIndex = messages.length - 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="min-h-[340px] space-y-4 rounded-2xl border border-border/60 bg-surface p-3 sm:p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="py-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
              <MessageText1 size={28} variant="Bold" />
            </span>
            <p className="mt-3 text-sm text-muted">{t("common.ai.chatEmpty")}</p>
            <div className="mx-auto mt-5 grid max-w-xl gap-2 sm:grid-cols-2">
              {quick.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={!enabled || busy}
                  onClick={() => void send(prompt)}
                  className="rounded-xl border border-border/60 bg-surface-secondary px-3 py-2.5 text-start text-sm leading-6 transition-colors hover:border-accent/50 disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[94%] sm:max-w-[82%] ${message.role === "user" ? "" : "w-full"}`}>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user" ? "bg-accent text-accent-foreground" : "border border-border/50 bg-surface-secondary"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-accent">
                      <Magicpen size={13} variant="Bold" />
                      {t("common.ai.title")}
                    </span>
                  ) : null}
                  <AiRichText text={message.text} />
                </div>
                {message.role === "assistant" ? (
                  <div className="mt-1.5 space-y-2">
                    <button
                      type="button"
                      onClick={() => void copy(index, message.text)}
                      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-foreground"
                    >
                      {copiedIndex === index ? <TickCircle size={13} variant="Bold" /> : <Copy size={13} />}
                      {copiedIndex === index ? t("common.ai.copied") : t("common.ai.copy")}
                    </button>
                    {index === lastIndex && message.followUps && message.followUps.length > 0 && !busy ? (
                      <div className="flex flex-wrap gap-2" aria-label={t("common.ai.followUps")}>
                        {message.followUps.map((item) => (
                          <Button key={item} size="sm" variant="secondary" onPress={() => void send(item)} isDisabled={!enabled}>
                            {item}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
        {busy ? (
          <div className="flex justify-end">
            <div className="w-56 space-y-2 rounded-2xl bg-surface-secondary px-4 py-3" aria-busy>
              <p className="text-xs text-muted">{t("common.ai.thinking")}</p>
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="flex items-end gap-2">
        <TextArea
          variant="secondary"
          rows={2}
          className="w-full"
          aria-label={t("common.ai.chatPlaceholder")}
          placeholder={t("common.ai.chatPlaceholder")}
          value={draft}
          maxLength={2000}
          disabled={!enabled}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void send(draft);
            }
          }}
        />
        <div className="flex flex-col gap-2">
          <Button isIconOnly aria-label={t("common.ai.send")} onPress={() => void send(draft)} isPending={busy} isDisabled={!enabled || !draft.trim()}>
            <Send2 size={20} variant="Bold" />
          </Button>
          {messages.length > 0 ? (
            <Button size="sm" variant="ghost" onPress={() => setMessages([])} isDisabled={busy}>
              {t("common.ai.newChat")}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-[11px] text-muted">{t("common.ai.chatHint")}</p>
    </div>
  );
}
