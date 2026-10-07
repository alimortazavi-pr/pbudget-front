"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";

import * as profileApi from "@/common/api/profile";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { useTranslation } from "@/components/providers/LanguageProvider";

export function BaleConnectSection() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<{ linked: boolean; botUsername: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await profileApi.fetchBaleStatus());
    } catch {
      // The section simply stays hidden if the status cannot be read.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!status) return null;

  async function connect() {
    setBusy(true);
    try {
      const { token, botUsername } = await profileApi.createBaleLink();
      window.open(`https://ble.ir/${botUsername}?start=link_${token}`, "_blank", "noopener,noreferrer");
      showToast(t("common.baleBot.linkOpened"), "success");
      // The bot links the account when the user presses Start; check again shortly.
      window.setTimeout(() => void load(), 8000);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await profileApi.unlinkBale();
      showToast(t("common.baleBot.disconnected"), "success");
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="bale" className="glass scroll-mt-24 space-y-4 rounded-2xl p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold">{t("common.baleBot.title")}</h2>
        <p className="text-sm text-muted">{t("common.baleBot.description")}</p>
      </div>
      {status.linked ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-success/15 px-3 py-2 text-sm text-success-foreground">{t("common.baleBot.connected")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" variant="secondary" className="w-full sm:flex-1" onPress={() => window.open(`https://ble.ir/${status.botUsername}`, "_blank", "noopener,noreferrer")}>
              {t("common.baleBot.openBot")}
            </Button>
            <Button type="button" variant="danger" className="w-full sm:flex-1" isPending={busy} onPress={() => void disconnect()}>
              {t("common.baleBot.disconnect")}
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" className="w-full" isPending={busy} onPress={() => void connect()}>
          {t("common.baleBot.connect")}
        </Button>
      )}
    </div>
  );
}
