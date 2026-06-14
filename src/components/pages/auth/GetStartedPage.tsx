"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, TextField } from "@heroui/react";

import * as authApi from "@/common/api/auth";
import { PATHS } from "@/common/constants";
import {
  APP_NAME_EN,
  APP_NAME_FA,
  APP_TAGLINE_FA,
} from "@/common/constants/brand";
import { saveDataToLocal, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { authenticate, setUsers, usersSelector } from "@/stores/auth";
import { setProfile } from "@/stores/profile";
import { SignInModal } from "./SignInModal";
import { SignUpModal } from "./SignUpModal";

export function GetStartedPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const users = useAppSelector(usersSelector);

  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleContinue(e?: FormEvent) {
    e?.preventDefault();
    setError("");

    const normalized = toEnglishDigits(mobile.trim());
    if (!/^09\d{9}$/.test(normalized)) {
      setError("شماره موبایل معتبر نیست");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.checkMobileExist(normalized);
      setHasPassword(res.hasPassword);
      setHasTelegram(res.hasTelegram);
      setNeedsPasswordSetup(Boolean(res.needsPasswordSetup));
      setMobile(normalized);
      if (res.isMustRegister || !res.hasPassword) {
        setSignUpOpen(true);
      } else {
        setSignInOpen(true);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  function onAuthSuccess(token: string, user: Parameters<typeof setProfile>[0]) {
    dispatch(authenticate({ token }));
    dispatch(setProfile(user));
    const nextUsers = [
      ...users.filter((u) => u._id !== user?._id),
      { ...user!, token },
    ];
    dispatch(setUsers(nextUsers));
    saveDataToLocal({ token, users: nextUsers });
    router.replace(PATHS.HOME);
  }

  return (
    <div className="min-h-dvh bg-background lg:flex lg:items-center lg:justify-center lg:p-8">
      <div className="flex h-dvh w-full flex-col overflow-hidden lg:h-auto lg:min-h-[34rem] lg:max-w-5xl lg:flex-row lg:overflow-hidden lg:rounded-3xl lg:border lg:border-border/60 lg:bg-surface lg:shadow-xl">
        <div className="flex h-[42%] shrink-0 items-center justify-center bg-gradient-to-br from-rose-50 via-background to-background px-6 lg:h-auto lg:min-h-[34rem] lg:flex-1 lg:from-rose-50/80 lg:via-surface-secondary lg:to-surface">
          <div className="text-center">
            <Image
              src="/assets/logo-mark.svg"
              alt=""
              width={88}
              height={88}
              className="mx-auto rounded-3xl shadow-md"
              priority
            />
            <p className="mt-5 text-3xl font-bold text-foreground lg:text-4xl">
              {APP_NAME_FA}
            </p>
            <p className="mt-2 font-display text-sm font-semibold tracking-[0.18em] text-muted lg:text-base">
              {APP_NAME_EN}
            </p>
            <p className="mt-4 hidden max-w-xs text-sm leading-7 text-muted lg:mx-auto lg:block">
              {APP_TAGLINE_FA}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-3xl border-t border-border/50 bg-surface px-5 pb-6 pt-6 lg:justify-center lg:rounded-none lg:rounded-s-3xl lg:border-t-0 lg:border-s lg:px-10 lg:py-10">
          <div className="shrink-0 lg:max-w-md">
            <h1 className="text-2xl font-bold text-foreground">خیلی خوش آمدی :)</h1>
            <p className="mt-3 text-base leading-7 text-muted">
              لطفا برای ورود یا ثبت‌نام شماره موبایل خود را وارد کنید.
            </p>
          </div>

          <form
            className="mt-auto flex shrink-0 flex-col pt-6 lg:mt-8 lg:max-w-md"
            onSubmit={(e) => void handleContinue(e)}
          >
            <TextField
              name="mobile"
              isRequired
              isInvalid={Boolean(error)}
              className="mb-1 gap-2"
            >
              <Label>شماره موبایل</Label>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setError("");
                }}
                autoComplete="tel"
                variant="secondary"
                className="min-h-14 text-base"
              />
              {error ? (
                <span className="text-sm text-danger">{error}</span>
              ) : null}
            </TextField>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isPending={loading}
              className="mt-4 min-h-12"
            >
              ادامه
            </Button>
          </form>
        </div>
      </div>

      <SignUpModal
        open={signUpOpen}
        onOpenChange={setSignUpOpen}
        mobile={mobile}
        needsPasswordSetup={needsPasswordSetup}
        onSuccess={onAuthSuccess}
      />
      <SignInModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        mobile={mobile}
        hasPassword={hasPassword}
        hasTelegram={hasTelegram}
        onSuccess={onAuthSuccess}
      />
    </div>
  );
}
