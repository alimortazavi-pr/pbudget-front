"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, ProgressBar, Tabs } from "@heroui/react";
import { Calendar2, Magicpen, MessageText1, Chart2 } from "iconsax-reactjs";

import { fetchAiStatus } from "@/common/api/ai";
import type { AiStatus } from "@/common/interfaces/ai.interface";
import { toPersianDigits } from "@/common/utils";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { AiChatPanel } from "@/components/pages/ai/AiChatPanel";
import { AiInsightsPanel } from "@/components/pages/ai/AiInsightsPanel";
import { AiPlanPanel } from "@/components/pages/ai/AiPlanPanel";
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
  const enabled = Boolean(status?.enabled) && !outOfQuota && !usage?.blocked;
  const low = usage ? usage.remaining <= Math.ceil(usage.limit * 0.2) : false;

  const notice = !status
    ? null
    : !status.enabled
      ? t("common.ai.disabled")
      : usage?.blocked
        ? t("common.ai.blocked")
        : outOfQuota
          ? t("common.ai.quotaOut")
          : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        icon={<Magicpen size={24} variant="Bold" />}
        title={t("common.ai.title")}
        description={t("common.ai.description")}
      />

      {notice ? (
        <Alert status={outOfQuota ? "warning" : "danger"}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{notice}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      {usage && usage.limit > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border/60 bg-surface px-4 py-3">
          <ProgressBar
            className="min-w-48 flex-1"
            aria-label={t("common.ai.usageLeft", { remaining: usage.remaining, limit: usage.limit })}
            value={(usage.used / usage.limit) * 100}
            color={outOfQuota ? "danger" : low ? "warning" : "accent"}
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <p className="text-sm">
            <span className="font-bold tabular-nums">{toPersianDigits(String(usage.remaining))}</span>
            <span className="text-muted"> / {toPersianDigits(String(usage.limit))} · {t("common.ai.usageReset")}</span>
          </p>
        </div>
      ) : null}

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label={t("common.ai.title")}>
            <Tabs.Tab id="insights">
              <span className="inline-flex items-center gap-1.5">
                <Chart2 size={16} variant="Bold" />
                {t("common.ai.tabInsights")}
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="plan">
              <span className="inline-flex items-center gap-1.5">
                <Calendar2 size={16} variant="Bold" />
                {t("common.ai.tabPlan")}
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="chat">
              <span className="inline-flex items-center gap-1.5">
                <MessageText1 size={16} variant="Bold" />
                {t("common.ai.tabChat")}
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="insights" className="pt-4">
          <AiInsightsPanel enabled={enabled} onStatus={setStatus} />
        </Tabs.Panel>
        <Tabs.Panel id="plan" className="pt-4">
          <AiPlanPanel enabled={enabled} onStatus={setStatus} />
        </Tabs.Panel>
        <Tabs.Panel id="chat" className="pt-4">
          <AiChatPanel enabled={enabled} onStatus={setStatus} />
        </Tabs.Panel>
      </Tabs>

      <p className="text-center text-xs leading-6 text-muted">{t("common.ai.disclaimer")}</p>
    </div>
  );
}
