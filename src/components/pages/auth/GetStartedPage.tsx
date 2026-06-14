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
  const [signUpOpen, setSignUpOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "#fb7185";

    return () => {
      document.body.style.overflow = "";
      document.body.style.backgroundColor = "";
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
      setMobile(normalized);
      if (res.isMustRegister) setSignUpOpen(true);
      else setSignInOpen(true);
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
    <div className="min-h-dvh bg-rose-400 lg:flex lg:items-center lg:justify-center lg:p-8">
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-rose-400 lg:h-auto lg:min-h-[34rem] lg:max-w-5xl lg:flex-row lg:overflow-hidden lg:rounded-3xl lg:shadow-2xl">
        <div className="flex h-[65%] shrink-0 items-center justify-center bg-rose-400 lg:h-auto lg:min-h-[34rem] lg:flex-1">
          <div className="text-center">
            <Image
              src="/assets/logo-mark.svg"
              alt=""
              width={96}
              height={96}
              className="mx-auto rounded-3xl shadow-lg"
              priority
            />
            <p className="mt-6 font-display text-3xl font-bold tracking-wide text-gray-900 lg:text-4xl">
              {APP_NAME_FA}
            </p>
            <p className="mt-2 text-sm font-semibold tracking-[0.2em] text-gray-700 lg:text-base">
              {APP_NAME_EN}
            </p>
            <p className="mt-4 hidden text-sm text-gray-800 lg:block">
              {APP_TAGLINE_FA}
            </p>
          </div>
        </div>

        <div className="flex h-[35%] min-h-0 shrink-0 flex-col overflow-y-auto rounded-t-2xl bg-white px-5 pb-6 pt-6 text-gray-900 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] lg:h-auto lg:min-h-[34rem] lg:justify-center lg:rounded-none lg:rounded-s-3xl lg:px-10 lg:py-10 lg:shadow-none">
          <div className="shrink-0 lg:max-w-md">
            <h1 className="text-2xl font-bold text-gray-900">خیلی خوش آمدی :)</h1>
            <p className="mt-4 text-base leading-7 text-gray-800">
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
              <Label className="text-gray-700">شماره موبایل</Label>
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
                className="min-h-14 rounded-xl border border-gray-200 bg-white text-base text-gray-900"
              />
              {error ? (
                <span className="text-sm text-red-500">{error}</span>
              ) : null}
            </TextField>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isPending={loading}
              className="mt-4 min-h-12 bg-rose-400 text-white data-[hover=true]:bg-rose-500"
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
        onSuccess={onAuthSuccess}
      />
      <SignInModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        mobile={mobile}
        hasPassword={hasPassword}
        onSuccess={onAuthSuccess}
      />
    </div>
  );
}
