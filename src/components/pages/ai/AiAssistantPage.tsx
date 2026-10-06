"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, ProgressBar, Tabs } from "@heroui/react";
import { Magicpen } from "iconsax-reactjs";

import { fetchAiStatus } from "@/common/api/ai";
import type { AiStatus } from "@/common/interfaces/ai.interface";
import { toPersianDigits } from "@/common/utils";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { AiChatPanel } from "@/components/pages/ai/AiChatPanel";
import { AiInsightsPanel } from "@/components/pages/ai/AiInsightsPanel";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function AiAssistantPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [tab, setTab] = useState("insights");

  const refresh = useCallback(async () => {
    try {
      setStatus(await fetchAiStatus());
    } catch {
      /* the panels surface their own errors */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const usage = status?.usage;
  const outOfQuota = Boolean(usage && usage.remaining <= 0);
  const enabled = Boolean(status?.enabled) && !outOfQuota;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        icon={<Magicpen size={24} variant="Bold" />}
        title={t("common.ai.title")}
        description={t("common.ai.description")}
      />

      {status && !status.enabled ? (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{t("common.ai.disabled")}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {usage ? (
        <div className="rounded-2xl border border-border/60 bg-surface p-4">
          <ProgressBar
            aria-label={t("common.ai.usageLeft", { remaining: usage.remaining, limit: usage.limit })}
            value={usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0}
            color={outOfQuota ? "danger" : usage.remaining <= Math.ceil(usage.limit * 0.2) ? "warning" : "accent"}
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold">
                {toPersianDigits(
                  t("common.ai.usageLeft", { remaining: usage.remaining, limit: usage.limit }),
                )}
              </span>
              <span className="text-xs text-muted">{status?.model.label}</span>
            </div>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <p className="mt-2 text-xs text-muted">{t("common.ai.usageReset")}</p>
        </div>
      ) : null}

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label={t("common.ai.title")}>
            <Tabs.Tab id="insights">
              {t("common.ai.tabInsights")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="chat">
              {t("common.ai.tabChat")}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="insights" className="pt-4">
          <AiInsightsPanel enabled={enabled} onStatus={setStatus} />
        </Tabs.Panel>
        <Tabs.Panel id="chat" className="pt-4">
          <AiChatPanel enabled={enabled} onStatus={setStatus} />
        </Tabs.Panel>
      </Tabs>

      <p className="text-center text-xs leading-6 text-muted">{t("common.ai.disclaimer")}</p>
    </div>
  );
}
