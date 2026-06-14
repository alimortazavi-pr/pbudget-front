"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import { showToast } from "@/common/utils/toast";
import { AppModal } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import type { IProfile } from "@/common/interfaces/profile.interface";

type SignUpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: string;
  onSuccess: (token: string, user: IProfile) => void;
};

export function SignUpModal({
  open,
  onOpenChange,
  mobile,
  onSuccess,
}: SignUpModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName("");
      setLastName("");
      setCode("");
      setPassword("");
    }
  }, [open]);

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
      const data = await authApi.signUp({
        firstName,
        lastName,
        mobile,
        code: code || undefined,
        password: password || undefined,
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
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog className="max-w-md">
        <form onSubmit={(e) => void submit(e)}>
          <Modal.Header>
            <Modal.Heading>ثبت‌نام</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            <FormInput label="نام" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <FormInput label="نام خانوادگی" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <FormInput label="موبایل" value={mobile} readOnly />
            <OtpCodeField label="کد تأیید" value={code} onChange={setCode} />
            <div className="flex justify-end">
              <Button type="button" size="sm" variant="secondary" onPress={() => void requestCode()}>
                ارسال کد
              </Button>
            </div>
            <FormInput
              label="رمز عبور (اختیاری)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" isPending={loading}>
              ثبت‌نام
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Dialog>
    </AppModal>
  );
}
