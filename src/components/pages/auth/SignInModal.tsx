"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalSheet, modalSheetBodyClass, modalSheetFooterClass, modalSheetFormClass, modalSheetHeaderClass } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import type { IProfile } from "@/common/interfaces/profile.interface";

type SignInModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: string;
  hasPassword: boolean;
  hasTelegram: boolean;
  onSuccess: (token: string, user: IProfile) => void;
};

export function SignInModal({
  open,
  onOpenChange,
  mobile,
  hasPassword,
  hasTelegram,
  onSuccess,
}: SignInModalProps) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(true);
  const [loading, setLoading] = useState(false);

  const otpEnabled = hasTelegram;
  const canUsePassword = hasPassword;
  const canLogin = canUsePassword || otpEnabled;

  useEffect(() => {
    if (!open) return;
    setCode("");
    setPassword("");
    if (canUsePassword) {
      setUsePassword(true);
    } else if (otpEnabled) {
      setUsePassword(false);
    }
  }, [open, canUsePassword, otpEnabled]);

  async function requestCode() {
    try {
      await authApi.requestCode(mobile);
      showToast("کد تأیید به تلگرام ارسال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canLogin) {
      showToast("ابتدا تلگرام را از پروفایل وصل کنید یا رمز عبور تنظیم کنید");
      return;
    }

    setLoading(true);
    try {
      const data = usePassword
        ? await authApi.signInWithPassword({ mobile, password })
        : await authApi.signIn({ mobile, code });
      onSuccess(data.token, data.user);
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ورود");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalSheet>
        <form onSubmit={(e) => void submit(e)} className={modalSheetFormClass}>
          <Modal.Header className={modalSheetHeaderClass}>
            <Modal.Heading>ورود</Modal.Heading>
          </Modal.Header>
          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            <FormInput label="موبایل" value={mobile} readOnly />

            {!canLogin ? (
              <p className="rounded-xl bg-surface-secondary px-3 py-2 text-sm leading-7 text-muted">
                ورود با کد غیرفعال است. از بات تلگرام وارد شوید و حساب را وصل
                کنید، یا بعد از ورود رمز عبور تنظیم کنید.
              </p>
            ) : usePassword ? (
              <FormInput
                label="رمز عبور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            ) : (
              <>
                <OtpCodeField label="کد تأیید تلگرام" value={code} onChange={setCode} />
                <p className="text-xs text-muted">
                  کد به تلگرام متصل‌شده شما ارسال می‌شود، نه پیامک.
                </p>
              </>
            )}

            <div className="flex items-center justify-between gap-4 pt-1">
              {!usePassword && otpEnabled ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  onPress={() => void requestCode()}
                >
                  ارسال کد به تلگرام
                </Button>
              ) : (
                <span />
              )}

              {canUsePassword && otpEnabled ? (
                <button
                  type="button"
                  className="cursor-pointer text-sm text-rose-500 hover:text-rose-600"
                  onClick={() => setUsePassword((v) => !v)}
                >
                  {usePassword ? "ورود با کد تلگرام" : "ورود با رمز عبور"}
                </button>
              ) : null}
            </div>
          </Modal.Body>
          <Modal.Footer className={modalSheetFooterClass}>
            <Button
              type="button"
              variant="ghost"
              onPress={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" isPending={loading} isDisabled={!canLogin}>
              ورود
            </Button>
          </Modal.Footer>
        </form>
      </AppModalSheet>
    </AppModal>
  );
}
