"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import * as profileApi from "@/common/api/profile";
import { saveDataToLocal, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { authenticate, setUsers } from "@/stores/auth";
import { setProfile } from "@/stores/profile";

type ChangeMobileModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentMobile: string;
};

export function ChangeMobileModal({
  open,
  onOpenChange,
  currentMobile,
}: ChangeMobileModalProps) {
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
    const normalized = toEnglishDigits(mobile.trim());
    if (!/^09\d{9}$/.test(normalized)) {
      showToast("شماره موبایل معتبر نیست");
      return;
    }
    if (normalized === currentMobile) {
      showToast("شماره واردشده همان شماره فعلی شماست");
      return;
    }

    setLoading(true);
    try {
      await authApi.requestCode(normalized);
      setMobile(normalized);
      setCodeSent(true);
      showToast("کد تأیید ارسال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
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
      showToast("شماره موبایل تغییر کرد", "success");
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog>
        <form onSubmit={(e) => void submit(e)}>
          <Modal.Header>
            <Modal.Heading>تغییر شماره موبایل</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">
            <FormInput
              label="شماره موبایل جدید"
              inputMode="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              readOnly={codeSent}
            />
            {codeSent ? (
              <>
                <OtpCodeField label="کد تأیید" value={code} onChange={setCode} />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    isPending={loading}
                    onPress={() => void requestCode()}
                  >
                    ارسال مجدد کد
                  </Button>
                </div>
              </>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              بستن
            </Button>
            <Button type="submit" isPending={loading}>
              {codeSent ? "تغییر شماره موبایل" : "درخواست کد تأیید"}
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Dialog>
    </AppModal>
  );
}
