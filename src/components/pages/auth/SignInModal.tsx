"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import { showToast } from "@/common/utils/toast";
import { AppModal } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import type { IProfile } from "@/common/interfaces/profile.interface";

type SignInModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: string;
  hasPassword: boolean;
  onSuccess: (token: string, user: IProfile) => void;
};

export function SignInModal({
  open,
  onOpenChange,
  mobile,
  hasPassword,
  onSuccess,
}: SignInModalProps) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(hasPassword);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setUsePassword(hasPassword);
      setCode("");
      setPassword("");
    }
  }, [open, hasPassword]);

  async function requestCode() {
    try {
      await authApi.requestCode(mobile);
      showToast("کد تأیید ارسال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
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
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog className="max-w-md">
        <form onSubmit={(e) => void submit(e)}>
          <Modal.Header>
            <Modal.Heading>ورود</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            <FormInput label="موبایل" value={mobile} readOnly />

            {usePassword ? (
              <FormInput
                label="رمز عبور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            ) : (
              <OtpCodeField label="کد تأیید" value={code} onChange={setCode} />
            )}

            <div className="flex items-center justify-between gap-4 pt-1">
              {!usePassword ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                  onPress={() => void requestCode()}
                >
                  ارسال کد
                </Button>
              ) : (
                <span />
              )}

              {hasPassword ? (
                <button
                  type="button"
                  className="cursor-pointer text-sm text-rose-500 hover:text-rose-600"
                  onClick={() => setUsePassword((v) => !v)}
                >
                  {usePassword ? "ورود با کد یکبار مصرف" : "ورود با رمز عبور"}
                </button>
              ) : null}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="ghost"
              onPress={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" isPending={loading}>
              ورود
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Dialog>
    </AppModal>
  );
}
