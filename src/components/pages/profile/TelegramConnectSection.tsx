"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useState } from "react";
import { Button } from "@heroui/react";

import * as profileApi from "@/common/api/profile";
import { APP_NAME_EN } from "@/common/constants/brand";
import {
  notifyTelegramStatusChanged,
  useTelegramStatus,
} from "@/common/hooks/useTelegramStatus";
import { showToast } from "@/common/utils/toast";

const FALLBACK_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? "";

export function TelegramConnectSection() {
  const { t } = useTranslation();
  const { linked, botUsername, loading, refresh } = useTelegramStatus();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const resolvedBotUsername = botUsername || FALLBACK_BOT_USERNAME;

  async function connectTelegram() {
    setConnecting(true);
    try {
      const { token, botUsername: apiBotUsername } =
        await profileApi.createTelegramLink();
      const username = apiBotUsername || resolvedBotUsername;

      if (!username) {
        showToast(t("auto.k55ef3acbea"));
        return;
      }

      const url = `https://t.me/${username}?start=link_${token}`;
      window.open(url, "_blank", "noopener,noreferrer");
      showToast(t("auto.k316f633607"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k29f284e281"));
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectTelegram() {
    setDisconnecting(true);
    try {
      await profileApi.unlinkTelegram();
      notifyTelegramStatusChanged();
      showToast(t("auto.k237d8718db"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.kb6e4d70efa"));
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div id="telegram" className="glass space-y-4 rounded-2xl p-5 scroll-mt-24">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{t("nav.telegramBot")}</h2>
        <p className="text-sm text-muted">
          {t("auto.k79ade96aa1")}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("common.loading")}</p>
      ) : linked ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-success/15 px-3 py-2 text-sm text-success-foreground">
            {t("auto.kc85d9f42db")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {resolvedBotUsername && (
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:flex-1"
                onPress={() =>
                  window.open(
                    `https://t.me/${resolvedBotUsername}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                {t("auto.kc41a153bdd")}
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              className="w-full sm:flex-1"
              isPending={disconnecting}
              onPress={() => void disconnectTelegram()}
            >
              {t("common.disconnect")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {t("auto.k8e7f4f0002")}{APP_NAME_EN} {t("auto.k0940628caf")}
            {t("auto.k5e0e6f8797")}
          </p>
          <Button
            type="button"
            className="w-full"
            isPending={connecting}
            onPress={() => void connectTelegram()}
          >
            {t("auto.k959bbb9c16")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onPress={() => {
              void refresh().then(() => notifyTelegramStatusChanged());
            }}
          >
            {t("auto.k9240a36c8f")}
          </Button>
        </div>
      )}
    </div>
  );
}
