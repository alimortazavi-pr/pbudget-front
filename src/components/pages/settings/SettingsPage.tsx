"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Call, Refresh } from "iconsax-reactjs";
import { Button } from "@heroui/react";

import { APP_VERSION } from "@/common/constants/app-version";
import { SUPPORT_PHONE } from "@/components/common/layout/shell-nav";
import { TelegramConnectSection } from "@/components/pages/profile/TelegramConnectSection";
import { UserPreferencesSettings } from "@/components/pages/settings/UserPreferencesSection";
import { SiteFooterCredits } from "@/components/common/brand/SiteFooterCredits";
import { AppModeSection } from "@/components/pages/settings/AppModeSection";
import { AppearanceSection } from "@/components/pages/settings/AppearanceSection";
import { useVersion } from "@/components/providers/VersionProvider";

export function SettingsPage() {
  const { t } = useTranslation();
  const { hasUpdate, applyUpdate, showChangelog } = useVersion();

  return (
    <div className="pb-form-page space-y-6">
      <AppearanceSection />

      <AppModeSection />

      <UserPreferencesSettings />

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
      <SiteFooterCredits className="pt-2" />
    </div>
  );
}
