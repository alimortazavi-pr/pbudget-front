"use client";

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
      showToast("ابتدا تلگرام را از پروفایل وصل کنید");
      return;
    }

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
      showToast("کد تأیید به تلگرام ارسال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!telegramLinked) {
      showToast("ابتدا تلگرام را وصل کنید");
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
      showToast("شماره موبایل تغییر کرد", "success");
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalSheet>
        <form onSubmit={(e) => void submit(e)} className={modalSheetFormClass}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>تغییر شماره موبایل</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className={`${modalSheetBodyClass} space-y-4`}>
            {!telegramLinked ? (
              <p className="rounded-xl bg-surface-secondary px-3 py-2 text-sm leading-7 text-muted">
                تغییر شماره با کد فقط وقتی فعال است که تلگرام وصل باشد. کد به
                تلگرام شما ارسال می‌شود.
              </p>
            ) : null}
            <FormInput
              label="شماره موبایل جدید"
              inputMode="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              readOnly={codeSent}
              disabled={!telegramLinked}
            />
            {codeSent ? (
              <>
                <OtpCodeField label="کد تأیید تلگرام" value={code} onChange={setCode} />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    isPending={loading}
                    onPress={() => void requestCode()}
                  >
                    ارسال مجدد به تلگرام
                  </Button>
                </div>
              </>
            ) : null}
          </Modal.Body>
          <Modal.Footer className={modalSheetFooterClass}>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              بستن
            </Button>
            <Button
              type="submit"
              isPending={loading}
              isDisabled={!telegramLinked}
            >
              {codeSent ? "تغییر شماره موبایل" : "درخواست کد در تلگرام"}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalSheet>
    </AppModal>
  );
}
