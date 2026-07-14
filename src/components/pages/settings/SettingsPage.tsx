"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useState } from "react";
import { Call, Building, Moon, Refresh, Sun1 } from "iconsax-reactjs";
import { Button, Switch } from "@heroui/react";
import Link from "next/link";

import { APP_VERSION } from "@/common/constants/app-version";
import { BUSINESS_SITE_URL } from "@/common/constants/products";
import { navigateWithSso } from "@/common/utils/sso";
import { SUPPORT_PHONE } from "@/components/common/layout/shell-nav";
import { VoiceAssistantSection } from "@/components/pages/profile/VoiceAssistantSection";
import { TelegramConnectSection } from "@/components/pages/profile/TelegramConnectSection";
import { UserPreferencesSettings } from "@/components/pages/settings/UserPreferencesSection";
import { AppModeSection } from "@/components/pages/settings/AppModeSection";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useVersion } from "@/components/providers/VersionProvider";

export function SettingsPage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { hasUpdate, applyUpdate, showChangelog } = useVersion();

  const [showSynced, setShowSynced] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("pbudget_show_synced_projects") !== "false";
    }
    return true;
  });

  const handleToggleSynced = (checked: boolean) => {
    setShowSynced(checked);
    localStorage.setItem("pbudget_show_synced_projects", String(checked));
  };

  return (
    <div className="pb-form-page space-y-6">
      <div className="glass rounded-2xl p-5" data-tour="settings-theme">
        <h2 className="text-lg font-bold">{t("common.appearance")}</h2>
        <p className="mt-1 text-sm text-muted">{t("common.appearanceDesc")}</p>
        <button
          type="button"
          className="mt-4 flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-surface-secondary px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-secondary/80"
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun1 size={20} /> : <Moon size={20} />}
          {theme === "dark" ? t("common.lightMode") : t("common.darkMode")}
        </button>
      </div>

      <AppModeSection />

      <UserPreferencesSettings />

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-4 text-start">
            <h2 className="text-lg font-bold">{t("common.businessSync")}</h2>
            <p className="mt-1 text-sm text-muted">{t("common.businessSyncDesc")}</p>
          </div>
          <Switch isSelected={showSynced} onChange={handleToggleSynced} size="sm">
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>
      </div>

      <div className="glass rounded-2xl p-5" data-tour="settings-business-product">
        <h2 className="text-lg font-bold">{t("common.paradiseBusinessDesk")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("common.paradiseBusinessDeskDesc")}
        </p>
        <button
          type="button"
          onClick={() => void navigateWithSso(BUSINESS_SITE_URL, "/business")}
          className="mt-4 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors hover:brightness-105"
          style={{
            borderColor: "color-mix(in oklch, #2dd4bf 30%, transparent)",
            background: "color-mix(in oklch, #2dd4bf 10%, transparent)",
            color: "#047857",
          }}
        >
          <Building size={20} variant="Bold" />
          {t("common.goToBusinessDesk")}
        </button>
      </div>

      <div data-tour="settings-voice">
        <VoiceAssistantSection />
      </div>

      <div data-tour="settings-telegram">
        <TelegramConnectSection />
      </div>

      <div data-tour="settings-support" className="space-y-6">
      <div className="glass rounded-2xl p-5">
        <h2 className="text-lg font-bold">{t("common.appVersion")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("common.currentVersion", { version: APP_VERSION })}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="secondary" className="w-full" onPress={showChangelog}>
            {t("common.viewChangelog")}
          </Button>
          {hasUpdate && (
            <Button variant="primary" className="w-full" onPress={applyUpdate}>
              <Refresh size={18} />
              {t("common.updateApp")}
            </Button>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="text-lg font-bold">{t("common.support")}</h2>
        <p className="mt-1 text-sm text-muted">{t("common.supportContactDesc")}</p>
        <a
          href={SUPPORT_PHONE}
          className="mt-4 flex w-full items-center gap-3 rounded-xl border border-border/50 bg-surface-secondary px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-secondary/80"
        >
          <Call size={20} />
          {t("common.contactSupport")}
        </a>
      </div>
      </div>
    </div>
  );
}
