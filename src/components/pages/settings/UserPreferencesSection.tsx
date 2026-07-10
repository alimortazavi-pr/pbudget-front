"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as profileApi from "@/common/api/profile";
import {
  CALENDAR_OPTIONS,
  CURRENCY_OPTIONS,
  type UserDateCalendar,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import { showToast } from "@/common/utils/toast";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { AppModal } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setProfile, userSelector } from "@/stores/profile";

type UserPreferencesSettingsProps = {
  compact?: boolean;
};

export function UserPreferencesSettings({ compact }: UserPreferencesSettingsProps) {
  const { t } = useTranslation();
  const { currencyLabel, calendarLabel, calendarDescription } = useCurrencyLabels();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const prefs = user?.preferences;
  const [currency, setCurrency] = useState<UserCurrency>("toman");
  const [dateCalendar, setDateCalendar] = useState<UserDateCalendar>("jalali");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!prefs) return;
    setCurrency(prefs.currency);
    setDateCalendar(prefs.dateCalendar);
  }, [prefs]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await profileApi.updateUserPreferences({
        currency,
        dateCalendar,
      });
      dispatch(setProfile(updated));
      showToast(t("common.settingsSaved"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    prefs &&
    (currency !== prefs.currency || dateCalendar !== prefs.dateCalendar);

  return (
    <div className={compact ? "space-y-4" : "glass rounded-2xl p-5 space-y-4"}>
      {!compact ? (
        <>
          <h2 className="text-lg font-bold">{t("common.currencyAndCalendar")}</h2>
          <p className="text-sm text-muted">{t("common.currencyAndCalendarDesc")}</p>
        </>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("common.defaultCurrencyType")}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {CURRENCY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                currency === option.id
                  ? "border-primary bg-primary/10 font-medium"
                  : "border-border/50 bg-surface-secondary/60"
              }`}
              onClick={() => setCurrency(option.id)}
            >
              {currencyLabel(option.id)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("common.defaultDateType")}</p>
        <div className="grid gap-2">
          {CALENDAR_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`rounded-xl border px-4 py-3 text-start transition-colors ${
                dateCalendar === option.id
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-surface-secondary/60"
              }`}
              onClick={() => setDateCalendar(option.id)}
            >
              <p className="text-sm font-medium">{calendarLabel(option.id)}</p>
              <p className="mt-0.5 text-xs text-muted">{calendarDescription(option.id)}</p>
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full sm:w-auto"
        isDisabled={!dirty}
        isPending={saving}
        onPress={() => void handleSave()}
      >
        {t("common.saveSettings")}
      </Button>
    </div>
  );
}

type UserPreferencesOnboardingModalProps = {
  open: boolean;
  onConfigured: () => void;
};

export function UserPreferencesOnboardingModal({
  open,
  onConfigured,
}: UserPreferencesOnboardingModalProps) {
  const { t } = useTranslation();
  const { currencyLabel, calendarLabel, calendarDescription } = useCurrencyLabels();
  const dispatch = useAppDispatch();
  const [currency, setCurrency] = useState<UserCurrency>("toman");
  const [dateCalendar, setDateCalendar] = useState<UserDateCalendar>("jalali");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const user = await profileApi.updateUserPreferences({
        currency,
        dateCalendar,
        configured: true,
      });
      dispatch(setProfile(user));
      showToast(t("common.settingsSaved"), "success");
      onConfigured();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={() => {}} isDismissable={false}>
      <Modal.Container size="md">
        <Modal.Dialog className="pb-form-page">
          <Modal.Header>
            <Modal.Heading>{t("common.initialSettings")}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-5">
              <p className="text-sm text-muted">{t("common.onboardingPrefsDesc")}</p>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("common.currencyType")}</p>
                <div className="grid gap-2">
                  {CURRENCY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`rounded-xl border px-4 py-3 text-start text-sm transition-colors ${
                        currency === option.id
                          ? "border-primary bg-primary/10 font-medium"
                          : "border-border/50 bg-surface-secondary/60"
                      }`}
                      onClick={() => setCurrency(option.id)}
                    >
                      {currencyLabel(option.id)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("common.dateType")}</p>
                <div className="grid gap-2">
                  {CALENDAR_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`rounded-xl border px-4 py-3 text-start transition-colors ${
                        dateCalendar === option.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-surface-secondary/60"
                      }`}
                      onClick={() => setDateCalendar(option.id)}
                    >
                      <p className="text-sm font-medium">{calendarLabel(option.id)}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {calendarDescription(option.id)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full"
                isPending={saving}
                onPress={() => void handleSave()}
              >
                {t("common.saveAndContinue")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </AppModal>
  );
}
