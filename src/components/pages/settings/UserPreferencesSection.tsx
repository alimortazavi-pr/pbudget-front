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
import { AppModal } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setProfile, userSelector } from "@/stores/profile";

type UserPreferencesSettingsProps = {
  compact?: boolean;
};

export function UserPreferencesSettings({ compact }: UserPreferencesSettingsProps) {
  const { t } = useTranslation();
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
      showToast(t("تنظیمات ذخیره شد"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ذخیره ناموفق");
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
          <h2 className="text-lg font-bold">{t("ارز و تقویم")}</h2>
          <p className="text-sm text-muted">
            تراکنش‌های جدید با این تنظیمات ثبت می‌شوند. تراکنش‌های قبلی ارز و
            تاریخ خودشان را حفظ می‌کنند.
          </p>
        </>
      ) : null}

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("نوع ارز پیش‌فرض")}</p>
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
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("نوع تاریخ پیش‌فرض")}</p>
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
              <p className="text-sm font-medium">{option.label}</p>
              <p className="mt-0.5 text-xs text-muted">{option.description}</p>
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
        ذخیره تنظیمات
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
}: UserPreferencesOnboardingModalProps) {  const { t } = useTranslation();

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
      showToast(t("تنظیمات ذخیره شد"), "success");
      onConfigured();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ذخیره ناموفق");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={() => {}} isDismissable={false}>
      <Modal.Container size="md">
        <Modal.Dialog className="pb-form-page">
          <Modal.Header>
            <Modal.Heading>{t("تنظیمات اولیه")}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-5">
              <p className="text-sm text-muted">
                قبل از اولین تراکنش، نوع ارز و تقویم پیش‌فرض خود را انتخاب کنید.
                تراکنش‌های بعدی با همین تنظیمات ثبت می‌شوند و هر تراکنش ارز و
                تاریخ خودش را حفظ می‌کند.
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("نوع ارز")}</p>
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
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">{t("نوع تاریخ")}</p>
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
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {option.description}
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
                ذخیره و ادامه
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
    </AppModal>
  );
}
