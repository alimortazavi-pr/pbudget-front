"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalHeader, AppModalSheet, modalSheetBodyClass, modalSheetFooterClass, modalSheetFormClass } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import type { IProfile } from "@/common/interfaces/profile.interface";

type SignUpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: string;
  needsPasswordSetup?: boolean;
  onSuccess: (token: string, user: IProfile) => void;
};

export function SignUpModal({
  open,
  onOpenChange,
  mobile,
  needsPasswordSetup = false,
  onSuccess,
}: SignUpModalProps) {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName("");
      setLastName("");
      setPassword("");
    }
  }, [open]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!password.trim() || password.trim().length < 6) {
      showToast(t("auto.k82e0ee6fcd"));
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.signUp({
        firstName,
        lastName,
        mobile,
        password: password.trim(),
      });
      onSuccess(data.token, data.user);
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalSheet>
        <form onSubmit={(e) => void submit(e)} className={modalSheetFormClass}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>
              {needsPasswordSetup ? "تکمیل ثبت‌نام" : "ثبت‌نام"}
            </Modal.Heading>
          </AppModalHeader>
          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            <FormInput label={t("common.name")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <FormInput label={t("auto.k342616c4fb")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <FormInput label={t("common.mobile")} value={mobile} readOnly />
            <FormInput
              label={t("common.password")}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auto.k8fdfe05e9a")}
            />
            <p className="text-xs leading-6 text-muted">
              با تعیین رمز عبور حساب شما ساخته می‌شود. اتصال تلگرام اختیاری است
              و بعداً از بخش پروفایل می‌توانید انجامش دهید؛ آن وقت کدهای تأیید
              هم به تلگرام می‌آید.
            </p>
          </Modal.Body>
          <Modal.Footer className={modalSheetFooterClass}>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" isPending={loading}>
              ثبت‌نام
            </Button>
          </Modal.Footer>
        </form>
      </AppModalSheet>
    </AppModal>
  );
}
