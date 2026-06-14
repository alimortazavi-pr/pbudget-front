"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import { showToast } from "@/common/utils/toast";
import { AppModal } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
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
      showToast("رمز عبور باید حداقل ۶ کاراکتر باشد");
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
            <FormInput
              label="رمز عبور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۶ کاراکتر"
            />
            <p className="text-xs text-muted">
              ورود با کد یکبارمصرف غیرفعال است. بعد از ثبت‌نام می‌توانید تلگرام
              را وصل کنید تا کد تأیید به تلگرام بیاید.
            </p>
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
