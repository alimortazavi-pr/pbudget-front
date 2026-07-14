"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button, Modal } from "@heroui/react";
import { ShieldTick } from "iconsax-reactjs";

import * as authApi from "@/common/api/auth";
import * as profileApi from "@/common/api/profile";
import { PATHS } from "@/common/constants";
import { saveDataToLocal } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalHeader, AppModalSheet, modalSheetBodyClass, modalSheetFooterClass, modalSheetFormClass } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import { ChangeMobileModal } from "@/components/pages/profile/ChangeMobileModal";
import { SimpleProfileShortcuts } from "@/components/pages/profile/SimpleProfileShortcuts";
import { useAppMode } from "@/components/providers/AppModeProvider";
import { useTelegramStatus } from "@/common/hooks/useTelegramStatus";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setUsers, tokenSelector } from "@/stores/auth";
import { setProfile, userSelector } from "@/stores/profile";

export function ProfilePage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const token = useAppSelector(tokenSelector);
  const users = useAppSelector((s) => s.auth.users);

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const { linked: telegramLinked } = useTelegramStatus();
  const { isSimple } = useAppMode();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void profileApi.fetchProfile().then((fresh) => {
      dispatch(setProfile(fresh));
      setFirstName(fresh.firstName);
      setLastName(fresh.lastName);

      if (!token) return;

      const nextUsers = users.map((u) =>
        u._id === fresh._id ? { ...fresh, token } : u,
      );
      dispatch(setUsers(nextUsers));
      saveDataToLocal({ token, users: nextUsers });
    });
    // Refresh profile once on mount so verification flags match the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  async function saveProfile(e?: FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile({ firstName, lastName });
      dispatch(setProfile(updated));
      const nextUsers = users.map((u) =>
        u._id === updated._id ? { ...updated, token: token! } : u,
      );
      dispatch(setUsers(nextUsers));
      saveDataToLocal({ token: token!, users: nextUsers });
      showToast(t("common.profileSaved"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e?: FormEvent) {
    e?.preventDefault();
    try {
      await profileApi.setPassword(password);
      showToast(t("common.passwordSet"), "success");
      setPasswordOpen(false);
      setPassword("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    }
  }

  async function verifyMobile(e?: FormEvent) {
    e?.preventDefault();
    try {
      const updated = await profileApi.verifyMobile(code);
      dispatch(setProfile(updated));
      const nextUsers = users.map((u) =>
        u._id === updated._id ? { ...updated, token: token! } : u,
      );
      dispatch(setUsers(nextUsers));
      saveDataToLocal({ token: token!, users: nextUsers });
      showToast(t("common.mobileVerified"), "success");
      setVerifyOpen(false);
      setCode("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    }
  }

  async function requestVerifyCode() {
    if (!user?.mobile) return;
    try {
      await authApi.requestCode(user.mobile);
      showToast(t("common.codeSentToTelegram"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    }
  }

  return (
    <div className="pb-form-page space-y-6">
      <form onSubmit={(e) => void saveProfile(e)}>
        <div className="glass space-y-4 rounded-2xl p-5">
          <h2 className="text-lg font-bold">{t("nav.profile")}</h2>

          {!user?.isVerifiedMobile && (
            <p className="rounded-xl bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
              {t("common.mobileNotVerified")}
            </p>
          )}
          {user?.isVerifiedMobile && (
            <p className="rounded-xl bg-success/15 px-3 py-2 text-sm text-success-foreground">
              {t("common.mobileVerifiedStatus")}
            </p>
          )}

          <FormInput
            label={t("common.firstName")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <FormInput
            label={t("common.lastName")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <FormInput label={t("common.mobile")} value={user?.mobile ?? ""} readOnly />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mb-0.5 shrink-0"
                onPress={() => setMobileOpen(true)}
              >
                {t("common.changeMobileNumber")}
              </Button>
            </div>

            {!user?.isVerifiedMobile && telegramLinked && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-secondary px-3 py-2.5">
                <span className="text-sm text-warning-foreground">
                  {t("common.mobileNotVerifiedShort")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={() => setVerifyOpen(true)}
                >
                  {t("common.verifyViaTelegram")}
                </Button>
              </div>
            )}
            {!user?.isVerifiedMobile && !telegramLinked && (
              <p className="rounded-xl bg-surface-secondary px-3 py-2 text-sm text-muted">
                {t("common.connectTelegramToVerify")}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onPress={() => setPasswordOpen(true)}
            >
              {t("common.setPassword")}
            </Button>
            <Button type="submit" className="w-full" size="lg" isPending={saving}>
              {t("common.saveChanges")}
            </Button>
          </div>
        </div>
      </form>

      {isSimple ? <SimpleProfileShortcuts /> : null}

      {user?.isAdmin && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">{t("common.adminPanel")}</h2>
              <p className="mt-1 text-sm text-muted">
                {t("common.adminPanelDesc")}
              </p>
            </div>
            <Link
              href={PATHS.ADMIN}
              className="inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2.5 text-sm font-medium hover:bg-surface-secondary/80"
            >
              <ShieldTick size={18} variant="Bold" />
              {t("common.enterAdminPanel")}
            </Link>
          </div>
        </div>
      )}

      <ChangeMobileModal
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        currentMobile={user?.mobile ?? ""}
        telegramLinked={telegramLinked}
      />

      <AppModal open={passwordOpen} onOpenChange={setPasswordOpen} mobileFull>
        <AppModalSheet>
          <form onSubmit={(e) => void savePassword(e)} className={modalSheetFormClass}>
            <AppModalHeader onClose={() => setPasswordOpen(false)}>
              <Modal.Heading>{t("common.password")}</Modal.Heading>
            </AppModalHeader>
            <Modal.Body className={modalSheetBodyClass}>
              <FormInput
                type="password"
                label={t("common.newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Modal.Body>
            <Modal.Footer className={modalSheetFooterClass}>
              <Button type="button" variant="ghost" onPress={() => setPasswordOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </Modal.Footer>
          </form>
        </AppModalSheet>
      </AppModal>

      <AppModal open={verifyOpen} onOpenChange={setVerifyOpen} mobileFull>
        <AppModalSheet>
          <form onSubmit={(e) => void verifyMobile(e)} className={modalSheetFormClass}>
            <AppModalHeader onClose={() => setVerifyOpen(false)}>
              <Modal.Heading>{t("common.verifyMobileHeading")}</Modal.Heading>
            </AppModalHeader>
            <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
              <OtpCodeField label={t("common.telegramVerifyCode")} value={code} onChange={setCode} />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={() => void requestVerifyCode()}
                >
                  {t("common.sendCodeToTelegram")}
                </Button>
              </div>
            </Modal.Body>
            <Modal.Footer className={modalSheetFooterClass}>
              <Button type="button" variant="ghost" onPress={() => setVerifyOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.verify")}</Button>
            </Modal.Footer>
          </form>
        </AppModalSheet>
      </AppModal>
    </div>
  );
}
