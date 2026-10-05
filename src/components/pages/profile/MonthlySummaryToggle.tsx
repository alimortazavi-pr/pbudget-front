"use client";

import { useState } from "react";
import { Switch } from "@heroui/react";

import * as profileApi from "@/common/api/profile";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setProfile, userSelector } from "@/stores/profile";

/** On/off for the monthly smart summary the bot sends on the 1st of each month. */
export function MonthlySummaryToggle() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [saving, setSaving] = useState(false);
  const enabled = user?.monthlySummaryEnabled !== false;

  async function toggle(next: boolean) {
    setSaving(true);
    try {
      dispatch(setProfile(await profileApi.updateUserPreferences({ monthlySummaryEnabled: next })));
      showToast(next ? t("common.monthlySummaryOn") : t("common.monthlySummaryOff"), "success");
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-surface-secondary/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">📊 {t("common.monthlySummaryTitle")}</p>
        <p className="mt-1 text-xs leading-6 text-muted">{t("common.monthlySummaryHint")}</p>
      </div>
      <Switch
        isSelected={enabled}
        isDisabled={saving}
        onChange={(value) => void toggle(value)}
        size="sm"
        aria-label={t("common.monthlySummaryTitle")}
      >
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </div>
  );
}
