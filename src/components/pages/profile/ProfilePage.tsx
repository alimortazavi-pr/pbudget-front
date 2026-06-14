"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import * as profileApi from "@/common/api/profile";
import { saveDataToLocal } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import { ChangeMobileModal } from "@/components/pages/profile/ChangeMobileModal";
import { TelegramConnectSection } from "@/components/pages/profile/TelegramConnectSection";
import { useTelegramStatus } from "@/common/hooks/useTelegramStatus";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setUsers, tokenSelector } from "@/stores/auth";
import { setProfile, userSelector } from "@/stores/profile";

export function ProfilePage() {
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
      showToast("پروفایل ذخیره شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e?: FormEvent) {
    e?.preventDefault();
    try {
      await profileApi.setPassword(password);
      showToast("رمز عبور تنظیم شد", "success");
      setPasswordOpen(false);
      setPassword("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
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
      showToast("موبایل تأیید شد", "success");
      setVerifyOpen(false);
      setCode("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function requestVerifyCode() {
    if (!user?.mobile) return;
    try {
      await authApi.requestCode(user.mobile);
      showToast("کد به تلگرام ارسال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  return (
    <div className="pb-form-page space-y-6">
      <form onSubmit={(e) => void saveProfile(e)}>
        <div className="glass space-y-4 rounded-2xl p-5">
          <h2 className="text-lg font-bold">پروفایل</h2>

          {!user?.isVerifiedMobile && (
            <p className="rounded-xl bg-warning/15 px-3 py-2 text-sm text-warning-foreground">
              موبایل شما تأیید نشده است
            </p>
          )}
          {user?.isVerifiedMobile && (
            <p className="rounded-xl bg-success/15 px-3 py-2 text-sm text-success-foreground">
              موبایل شما تأیید شده است
            </p>
          )}

          <FormInput
            label="نام"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <FormInput
            label="نام خانوادگی"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <FormInput label="موبایل" value={user?.mobile ?? ""} readOnly />
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mb-0.5 shrink-0"
                onPress={() => setMobileOpen(true)}
              >
                تغییر شماره
              </Button>
            </div>

            {!user?.isVerifiedMobile && telegramLinked && (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-secondary px-3 py-2.5">
                <span className="text-sm text-warning-foreground">
                  شماره موبایل تأیید نشده
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={() => setVerifyOpen(true)}
                >
                  تأیید با تلگرام
                </Button>
              </div>
            )}
            {!user?.isVerifiedMobile && !telegramLinked && (
              <p className="rounded-xl bg-surface-secondary px-3 py-2 text-sm text-muted">
                برای تأیید شماره، ابتدا تلگرام را وصل کنید.
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
              تنظیم رمز عبور
            </Button>
            <Button type="submit" className="w-full" size="lg" isPending={saving}>
              ذخیره تغییرات
            </Button>
          </div>
        </div>
      </form>

      <TelegramConnectSection />

      <ChangeMobileModal
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        currentMobile={user?.mobile ?? ""}
        telegramLinked={telegramLinked}
      />

      <AppModal open={passwordOpen} onOpenChange={setPasswordOpen}>
        <Modal.Dialog>
          <form onSubmit={(e) => void savePassword(e)}>
            <Modal.Header>
              <Modal.Heading>رمز عبور</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <FormInput
                type="password"
                label="رمز عبور جدید"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setPasswordOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">ذخیره</Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </AppModal>

      <AppModal open={verifyOpen} onOpenChange={setVerifyOpen}>
        <Modal.Dialog>
          <form onSubmit={(e) => void verifyMobile(e)}>
            <Modal.Header>
              <Modal.Heading>تأیید موبایل</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              <OtpCodeField label="کد تأیید تلگرام" value={code} onChange={setCode} />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onPress={() => void requestVerifyCode()}
                >
                  ارسال کد به تلگرام
                </Button>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setVerifyOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">تأیید</Button>
            </Modal.Footer>
          </form>
        </Modal.Dialog>
      </AppModal>
    </div>
  );
}
