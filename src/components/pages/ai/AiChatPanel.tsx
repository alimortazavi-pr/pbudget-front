"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Skeleton, TextArea } from "@heroui/react";
import { Magicpen, MessageText1, Send2 } from "iconsax-reactjs";

import { sendAiChat } from "@/common/api/ai";
import type { AiChatMessage, AiStatus } from "@/common/interfaces/ai.interface";
import { showErrorToast } from "@/common/utils/toast";
import { AiRichText } from "@/components/pages/ai/AiRichText";
import { useTranslation } from "@/components/providers/LanguageProvider";

const STORAGE_KEY = "pb-ai-chat";
const MAX_STORED = 24;

function loadMessages(): AiChatMessage[] {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AiChatMessage[]) : [];
    return Array.isArray(parsed) ? parsed.slice(-MAX_STORED) : [];
  } catch {
    return [];
  }
}

export function AiChatPanel({ enabled, onStatus }: { enabled: boolean; onStatus: (status: AiStatus) => void }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
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
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy, restored]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy || !enabled) return;
    const next: AiChatMessage[] = [...messages, { role: "user", text: content }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      const response = await sendAiChat(next);
      setMessages([...next, { role: "assistant", text: response.reply }]);
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

  const quick = [t("common.ai.quick1"), t("common.ai.quick2"), t("common.ai.quick3"), t("common.ai.quick4")];

  return (
    <div className="flex flex-col gap-4">
      <div className="min-h-[320px] space-y-4 rounded-2xl border border-border/60 bg-surface p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="py-6 text-center">
            <MessageText1 size={34} variant="Bold" className="mx-auto text-accent" />
            <p className="mt-3 text-sm text-muted">{t("common.ai.chatEmpty")}</p>
            <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
              {quick.map((prompt) => (
                <Button key={prompt} size="sm" variant="secondary" onPress={() => void send(prompt)} isDisabled={!enabled || busy}>
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm sm:max-w-[80%] ${
                  message.role === "user" ? "bg-accent text-accent-foreground" : "bg-surface-secondary"
                }`}
              >
                {message.role === "assistant" ? (
                  <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <Magicpen size={13} variant="Bold" />
                    {t("common.ai.title")}
                  </span>
                ) : null}
                <AiRichText text={message.text} />
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
    </div>
  );
}
