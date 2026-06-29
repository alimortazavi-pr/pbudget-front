"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { ArrowRight2, Sms } from "iconsax-reactjs";

import * as authApi from "@/common/api/auth";
import { toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";

const FALLBACK_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "") ?? "";

function buildTelegramRecoverUrl(
  botUsername: string | null | undefined,
  payload: string,
) {
  const username = (botUsername || FALLBACK_BOT_USERNAME).replace(/^@/, "");
  if (!username) return null;
  return `https://t.me/${username}?start=${payload}`;
}

type ForgotPasswordStepProps = {
  mobile: string;
  onBack: () => void;
  onSuccess: () => void;
};

export function ForgotPasswordStep({
  mobile,
  onBack,
  onSuccess,
}: ForgotPasswordStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [telegramRequired, setTelegramRequired] = useState<{
    message: string;
    botUsername: string | null;
    botStartPayload: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleRequestCode() {
    setError("");
    setTelegramRequired(null);
    setLoading(true);
    try {
      const result = await authApi.requestPasswordReset(mobile);
      if ("telegramRequired" in result && result.telegramRequired) {
        setTelegramRequired({
          message: result.message,
          botUsername: result.botUsername,
          botStartPayload: result.botStartPayload,
        });
        return;
      }
      setCodeSent(true);
      showToast(result.message, "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در ارسال کد";
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (newPassword.trim().length < 6) {
      showToast("رمز عبور حداقل ۶ کاراکتر");
      return;
    }
    if (toEnglishDigits(code).length !== 6) {
      showToast("کد ۶ رقمی را کامل وارد کنید");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword({
        mobile,
        code: toEnglishDigits(code),
        password: newPassword.trim(),
      });
      showToast("رمز عبور تغییر کرد — اکنون وارد شوید", "success");
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "خطا در تغییر رمز";
      setError(msg);
      showToast(msg);
    } finally {
      setLoading(false);
    }
  }

  const recoverUrl = telegramRequired
    ? buildTelegramRecoverUrl(
        telegramRequired.botUsername,
        telegramRequired.botStartPayload,
      )
    : null;

  return (
    <div className="mt-10 space-y-6">
      <button
        type="button"
        className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
        onClick={onBack}
      >
        <ArrowRight2 size={16} />
        بازگشت به ورود
      </button>

      <FormInput label="موبایل" value={mobile} readOnly />

      {telegramRequired ? (
        <div className="space-y-4 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-4">
          <p className="text-sm leading-7 text-foreground">{telegramRequired.message}</p>
          <ul className="list-disc space-y-1 ps-5 text-sm leading-7 text-muted">
            <li>بات تلگرام را باز کنید و «شروع» را بزنید.</li>
            <li>فقط با دکمه «اشتراک‌گذاری شماره تلگرام» شماره را بفرستید — تایپ دستی پذیرفته نمی‌شود.</li>
            <li>شماره تلگرام باید دقیقاً با شماره ثبت‌نام شما یکی باشد.</li>
          </ul>
          {recoverUrl ? (
            <Button
              type="button"
              className="w-full"
              onPress={() =>
                window.open(recoverUrl, "_blank", "noopener,noreferrer")
              }
            >
              باز کردن بات تلگرام
            </Button>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onPress={() => void handleRequestCode()}
            isPending={loading}
          >
            بعد از اتصال، دوباره تلاش کنید
          </Button>
        </div>
      ) : !codeSent ? (
        <Button
          type="button"
          size="lg"
          className="w-full"
          isPending={loading}
          onPress={() => void handleRequestCode()}
        >
          <Sms size={18} />
          ارسال کد بازیابی به تلگرام
        </Button>
      ) : (
        <>
          <OtpCodeField label="کد تلگرام" value={code} onChange={setCode} />
          <FormInput
            label="رمز عبور جدید"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
            }}
          />
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onPress={() => void handleRequestCode()}
            isPending={loading}
          >
            ارسال مجدد کد
          </Button>
          <Button
            type="button"
            size="lg"
            className="w-full"
            isPending={loading}
            onPress={() => void handleReset()}
          >
            ذخیره رمز جدید
          </Button>
        </>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
