"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, TextField } from "@heroui/react";
import {
  ArrowLeft2,
  ArrowRight2,
  Building,
  Home2,
  Login,
  Profile2User,
  Shield,
  Sms,
} from "iconsax-reactjs";

import * as authApi from "@/common/api/auth";
import { PATHS } from "@/common/constants";
import {
  APP_NAME_EN,
  APP_NAME_FA,
  APP_TAGLINE_FA,
} from "@/common/constants/brand";
import type { IProfile } from "@/common/interfaces/profile.interface";
import { saveDataToLocal, toEnglishDigits } from "@/common/utils";
import {
  saveAuthReturnUrl,
  validateAuthReturnUrl,
} from "@/common/utils/auth-flow";
import {
  resolvePostAuthDestination,
  type PostLoginChoice,
} from "@/common/utils/post-auth";
import { scrollFieldIntoView } from "@/common/utils/scroll";
import { completeWorkspaceSelection } from "@/common/utils/workspace-selection";
import { showToast } from "@/common/utils/toast";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { FormInput } from "@/components/common/form/FormFields";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  authenticate,
  isAuthSelector,
  setUsers,
  usersSelector,
} from "@/stores/auth";
import { setProfile } from "@/stores/profile";

type Step = "mobile" | "register" | "signin" | "workspace";

const STEP_META: Record<Exclude<Step, "workspace">, { title: string; sub: string }> = {
  mobile: {
    title: "ورود یا ثبت‌نام",
    sub: "شماره موبایل خود را وارد کنید تا مسیر مناسب را پیدا کنیم.",
  },
  register: {
    title: "ساخت حساب",
    sub: "اطلاعات خود را تکمیل کنید. اگر از طرف کارفرما دعوت شده‌اید، همین شماره را وارد کرده‌اید.",
  },
  signin: {
    title: "خوش برگشتی",
    sub: "با رمز عبور یا کد تلگرام وارد شوید.",
  },
};

export function GetStartedPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const users = useAppSelector(usersSelector);
  const isAuth = useAppSelector(isAuthSelector);

  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [hasPassword, setHasPassword] = useState(false);
  const [hasTelegram, setHasTelegram] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [usePassword, setUsePassword] = useState(true);

  const [choices, setChoices] = useState<PostLoginChoice[]>([]);
  const [returnBanner, setReturnBanner] = useState<string | null>(null);

  useEffect(() => {
    const ret = validateAuthReturnUrl(searchParams.get("return"));
    if (ret) {
      saveAuthReturnUrl(ret);
      setReturnBanner(ret);
    }
  }, [searchParams]);

  const finishAuth = useCallback(
    async (token: string, user: IProfile) => {
      dispatch(authenticate({ token }));
      dispatch(setProfile(user));
      const nextUsers = [
        ...users.filter((u) => u._id !== user._id),
        { ...user, token },
      ];
      dispatch(setUsers(nextUsers));
      saveDataToLocal({ token, users: nextUsers });

      const ret = validateAuthReturnUrl(searchParams.get("return"));
      const result = await resolvePostAuthDestination({
        returnUrl: ret,
        user,
      });

      if (result.needsPicker && result.context) {
        setChoices(result.context.choices);
        setStep("workspace");
        return;
      }

      router.replace(result.path ?? PATHS.HOME);
    },
    [dispatch, router, searchParams, users],
  );

  useEffect(() => {
    if (!isAuth) return;
    void resolvePostAuthDestination({
      returnUrl: searchParams.get("return"),
    }).then((r) => {
      if (r.needsPicker && r.context) {
        setChoices(r.context.choices);
        setStep("workspace");
        return;
      }
      router.replace(r.path ?? PATHS.HOME);
    });
  }, [isAuth, router, searchParams]);

  async function handleMobile(e?: FormEvent) {
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
      setMobile(normalized);
      setHasPassword(res.hasPassword);
      setHasTelegram(res.hasTelegram);
      setNeedsPasswordSetup(Boolean(res.needsPasswordSetup));
      if (res.isMustRegister || !res.hasPassword) {
        setStep("register");
      } else {
        setUsePassword(true);
        setStep("signin");
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e?: FormEvent) {
    e?.preventDefault();
    if (password.trim().length < 6) {
      showToast("رمز عبور حداقل ۶ کاراکتر");
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
      await finishAuth(data.token, data.user);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  }

  async function requestCode() {
    try {
      await authApi.requestCode(mobile);
      showToast("کد به تلگرام ارسال شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  async function handleSignIn(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const data = usePassword
        ? await authApi.signInWithPassword({ mobile, password })
        : await authApi.signIn({ mobile, code });
      await finishAuth(data.token, data.user);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ورود");
    } finally {
      setLoading(false);
    }
  }

  function choiceIcon(kind: string) {
    if (kind === "admin") return Shield;
    if (kind === "business" || kind === "attendance") return Building;
    if (kind === "invites") return Profile2User;
    return Home2;
  }

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 md:px-8">
        <Link href={PATHS.LANDING} className="text-sm font-medium text-muted hover:text-foreground">
          {APP_NAME_FA}
        </Link>
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col lg:flex-row">
        <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-rose-500/10 via-violet-500/5 to-background p-10 lg:flex">
          <div>
            <Image src="/assets/logo-mark.svg" alt="" width={64} height={64} className="rounded-2xl shadow-md" />
            <h2 className="mt-6 text-3xl font-bold">{APP_NAME_FA}</h2>
            <p className="mt-2 font-display text-sm tracking-widest text-muted">{APP_NAME_EN}</p>
            <p className="mt-6 max-w-sm leading-8 text-muted">{APP_TAGLINE_FA}</p>
          </div>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex items-center gap-2"><Home2 size={18} />میز شخصی — مالی و برنامه روزانه</li>
            <li className="flex items-center gap-2"><Building size={18} />فضای کسب‌وکار و حضور GPS</li>
            <li className="flex items-center gap-2"><Profile2User size={18} />پرسنل، شریک و دعوت‌ها</li>
          </ul>
        </aside>

        <main className="flex flex-1 flex-col justify-center px-5 py-20 lg:px-12">
          {returnBanner ? (
            <p className="mb-6 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-muted">
              بعد از ورود به{" "}
              <span className="font-medium text-foreground" dir="ltr">
                {returnBanner}
              </span>{" "}
              هدایت می‌شوید.
            </p>
          ) : null}

          {step === "workspace" ? (
            <div className="mx-auto w-full max-w-md">
              <h1 className="text-2xl font-bold">کجا می‌روید؟</h1>
              <p className="mt-2 text-muted">چند فضای کاری دارید — یکی را انتخاب کنید.</p>
              <ul className="mt-8 space-y-3">
                {choices.map((c) => {
                  const Icon = choiceIcon(c.kind);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-start transition hover:border-accent hover:shadow-md"
                        onClick={() => {
                          void completeWorkspaceSelection(c).then(() => {
                            router.replace(c.path);
                          });
                        }}
                      >
                        <span className="flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
                          <Icon size={22} />
                        </span>
                        <span>
                          <span className="block font-semibold">{c.label}</span>
                          <span className="text-sm text-muted">{c.description}</span>
                        </span>
                        <ArrowLeft2 size={18} className="mr-auto text-muted" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-md">
              {step !== "mobile" ? (
                <button
                  type="button"
                  className="mb-6 flex items-center gap-1 text-sm text-muted hover:text-foreground"
                  onClick={() => setStep("mobile")}
                >
                  <ArrowRight2 size={16} />
                  تغییر شماره
                </button>
              ) : null}

              <div className="mb-8 lg:hidden text-center">
                <Image src="/assets/logo-mark.svg" alt="" width={56} height={56} className="mx-auto rounded-2xl" />
              </div>

              <h1 className="text-2xl font-bold lg:text-3xl">{STEP_META[step].title}</h1>
              <p className="mt-2 leading-7 text-muted">{STEP_META[step].sub}</p>

              {step === "mobile" ? (
                <form className="mt-8 space-y-4" onSubmit={(e) => void handleMobile(e)}>
                  <TextField isInvalid={Boolean(error)}>
                    <Label>شماره موبایل</Label>
                    <Input
                      type="tel"
                      inputMode="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      value={mobile}
                      onChange={(e) => { setMobile(e.target.value); setError(""); }}
                      onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                      className="min-h-12 text-base"
                    />
                    {error ? <span className="text-sm text-danger">{error}</span> : null}
                  </TextField>
                  <Button type="submit" size="lg" className="w-full" isPending={loading}>
                    ادامه
                    <ArrowLeft2 size={18} />
                  </Button>
                </form>
              ) : null}

              {step === "register" ? (
                <form className="mt-8 space-y-4" onSubmit={(e) => void handleRegister(e)}>
                  {needsPasswordSetup ? (
                    <p className="rounded-xl bg-surface-secondary px-3 py-2 text-sm text-muted">
                      حساب شما از قبل ساخته شده — فقط رمز عبور را تکمیل کنید.
                    </p>
                  ) : null}
                  <FormInput label="نام" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <FormInput label="نام خانوادگی" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  <FormInput label="موبایل" value={mobile} readOnly />
                  <FormInput label="رمز عبور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Button type="submit" size="lg" className="w-full" isPending={loading}>
                    {needsPasswordSetup ? "تکمیل و ورود" : "ثبت‌نام"}
                  </Button>
                </form>
              ) : null}

              {step === "signin" ? (
                <form className="mt-8 space-y-4" onSubmit={(e) => void handleSignIn(e)}>
                  <FormInput label="موبایل" value={mobile} readOnly />
                  {usePassword ? (
                    <FormInput label="رمز عبور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  ) : (
                    <>
                      <OtpCodeField label="کد تلگرام" value={code} onChange={setCode} />
                      <Button type="button" variant="secondary" size="sm" onPress={() => void requestCode()}>
                        <Sms size={16} />
                        ارسال کد
                      </Button>
                    </>
                  )}
                  {hasPassword && hasTelegram ? (
                    <button type="button" className="text-sm text-accent" onClick={() => setUsePassword((v) => !v)}>
                      {usePassword ? "ورود با کد تلگرام" : "ورود با رمز عبور"}
                    </button>
                  ) : null}
                  <Button type="submit" size="lg" className="w-full" isPending={loading}>
                    <Login size={18} />
                    ورود
                  </Button>
                </form>
              ) : null}

              <p className="mt-8 text-center text-xs text-muted">
                با ادامه، شرایط استفاده از {APP_NAME_FA} را می‌پذیرید.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
