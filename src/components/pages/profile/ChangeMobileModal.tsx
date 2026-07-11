"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import * as profileApi from "@/common/api/profile";
import { saveDataToLocal, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalHeader, AppModalSheet, modalSheetBodyClass, modalSheetFooterClass, modalSheetFormClass } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { authenticate, setUsers } from "@/stores/auth";
import { setProfile } from "@/stores/profile";

type ChangeMobileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMobile: string;
  telegramLinked: boolean;
};

export function ChangeMobileModal({
  open,
  onOpenChange,
  currentMobile,
  telegramLinked,
}: ChangeMobileModalProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const users = useAppSelector((s) => s.auth.users);
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMobile("");
      setCode("");
      setCodeSent(false);
    }
  }, [open]);

  async function requestCode() {
    if (!telegramLinked) {
      showToast(t("auto.k5991535a7b"));
      return;
    }

    const normalized = toEnglishDigits(mobile.trim());
    if (!/^09\d{9}$/.test(normalized)) {
      showToast(t("auto.ke5ea291b1e"));
      return;
    }
    if (normalized === currentMobile) {
      showToast(t("auto.kd698f15913"));
      return;
    }

    setLoading(true);
    try {
      await authApi.requestCode(normalized);
      setMobile(normalized);
      setCodeSent(true);
      showToast(t("auto.k7d82e2b7f5"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!telegramLinked) {
      showToast(t("auto.k09e4ad52ec"));
      return;
    }
    if (!codeSent) {
      await requestCode();
      return;
    }

    setLoading(true);
    try {
      const { token: newToken, user } = await profileApi.changeMobile({
        mobile,
        code,
      });
      dispatch(authenticate({ token: newToken }));
      dispatch(setProfile(user));
      const nextUsers = users.map((u) =>
        u._id === user._id ? { ...user, token: newToken } : u,
      );
      dispatch(setUsers(nextUsers));
      saveDataToLocal({ token: newToken, users: nextUsers });
      showToast(t("auto.kdb5b306d40"), "success");
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalSheet>
        <form onSubmit={(e) => void submit(e)} className={modalSheetFormClass}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{t("auto.kd4d234a99e")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            {!telegramLinked ? (
              <p className="rounded-xl bg-surface-secondary px-3 py-2 text-sm leading-7 text-muted">
                {t("common.changeMobileTelegramHint")}
              </p>
            ) : null}
            <FormInput
              label={t("auto.k57b15c0a5d")}
              inputMode="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              readOnly={codeSent}
              disabled={!telegramLinked}
            />
            {codeSent ? (
              <>
                <OtpCodeField label={t("auto.k4713c59240")} value={code} onChange={setCode} />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    isPending={loading}
                    onPress={() => void requestCode()}
                  >
                    {t("common.resendToTelegram")}
                  </Button>
                </div>
              </>
            ) : null}
          </Modal.Body>
          <Modal.Footer className={modalSheetFooterClass}>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
            <Button
              type="submit"
              isPending={loading}
              isDisabled={!telegramLinked}
            >
              {codeSent ? t("auto.kd95391891a") : t("common.requestCodeViaTelegram")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalSheet>
    </AppModal>
  );
}
