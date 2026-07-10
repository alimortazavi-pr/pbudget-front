"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@heroui/react";
import {
  ArrowLeft2,
  ArrowRight2,
  Chart,
  Home2,
  Login,
  Profile2User,
  Sms,
} from "iconsax-reactjs";

import * as authApi from "@/common/api/auth";
import { PATHS } from "@/common/constants";
import {
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
} from "@/common/utils/post-auth";
import { showToast } from "@/common/utils/toast";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppLogo } from "@/components/common/brand/AppLogo";
import { SiteFooterCredits } from "@/components/common/brand/SiteFooterCredits";
import { FormInput } from "@/components/common/form/FormFields";
import { ForgotPasswordStep } from "@/components/pages/auth/ForgotPasswordStep";
import { OtpCodeField } from "@/components/common/form/OtpCodeField";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  authenticate,
  isAuthSelector,
  setUsers,
  usersSelector,
} from "@/stores/auth";
import { setProfile } from "@/stores/profile";

type Step = "mobile" | "register" | "signin" | "reset";

const STEP_META: Record<Step, { title: string; sub: string }> = {
  mobile: {
    title: "ورود یا ثبت‌نام",
    sub: "شماره موبایل خود را وارد کنید.",
  },
  register: {
    title: "ساخت حساب",
    sub: "اطلاعات خود را تکمیل کنید.",
  },
  signin: {
    title: "خوش برگشتی",
    sub: "با رمز عبور یا کد تلگرام وارد شوید.",
  },
  reset: {
    title: "بازیابی رمز عبور",
    sub: "کد تأیید به تلگرام متصل‌شده ارسال می‌شود.",
  },
};

const BRAND_FEATURES = [
  { icon: Home2, text: "مدیریت مالی شخصی" },
  { icon: Chart, text: "تحلیل و بودجه‌بندی" },
  { icon: Profile2User, text: "پروژه، شریک و برنامه روزانه" },
] as const;

export function GetStartedPage() {
  const { t } = useTranslation();
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

      if (result.needsPicker) {
        router.replace(PATHS.WORKSPACE);
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
      if (r.needsPicker) {
        router.replace(PATHS.WORKSPACE);
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
      showToast(t("auto.k19c70f8d7e"));
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
      showToast(t("auto.kf00a557956"), "success");
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

  return (
    <div className="relative min-h-dvh bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklch,var(--brand-rose)_10%,transparent),transparent)]"
      />

      <div className="relative mx-auto grid min-h-dvh lg:grid-cols-2">
        <main className="order-2 flex min-h-dvh flex-col lg:order-1">
          <div className="flex items-center justify-between px-5 pt-5 lg:px-12 lg:pt-8">
            <div className="lg:hidden">
              <Link href={PATHS.LANDING}>
                <AppLogo size={40} />
              </Link>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-8 lg:px-12 lg:py-14">
            <div className="w-full max-w-lg">
              {returnBanner ? (
                <p className="mb-5 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm leading-7 text-muted">
                  بعد از ورود به{" "}
                  <span className="font-medium text-foreground" dir="ltr">
                    {returnBanner}
                  </span>{" "}
                  هدایت می‌شوید.
                </p>
              ) : null}

              <div className="rounded-3xl border border-border bg-surface p-7 shadow-sm md:p-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {step !== "mobile" && step !== "reset" ? (
                      <button
                        type="button"
                        className="mb-8 flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
                        onClick={() => setStep("mobile")}
                      >
                        <ArrowRight2 size={16} />
                        تغییر شماره
                      </button>
                    ) : null}

                    <h1 className="text-2xl font-bold leading-snug lg:text-3xl">{STEP_META[step].title}</h1>
                    <p className="mt-3 text-base leading-8 text-muted">{STEP_META[step].sub}</p>

                    {step === "mobile" ? (
                      <form className="mt-10 space-y-7" onSubmit={(e) => void handleMobile(e)}>
                        <FormInput
                          label={t("auto.k1d0204302f")}
                          type="tel"
                          inputMode="tel"
                          placeholder={t("auto.k31b5be1e8a")}
                          value={mobile}
                          onChange={(e) => { setMobile(e.target.value); setError(""); }}
                          aria-invalid={Boolean(error)}
                        />
                        {error ? <p className="text-sm text-danger">{error}</p> : null}
                        <Button type="submit" size="lg" className="w-full" isPending={loading}>
                          ادامه
                          <ArrowLeft2 size={18} />
                        </Button>
                      </form>
                    ) : null}

                    {step === "register" ? (
                      <form className="mt-10 space-y-6" onSubmit={(e) => void handleRegister(e)}>
                        {needsPasswordSetup ? (
                          <p className="rounded-2xl bg-surface-secondary px-4 py-3 text-sm leading-7 text-muted">
                            حساب شما از قبل ساخته شده — فقط رمز عبور را تکمیل کنید.
                          </p>
                        ) : null}
                        <FormInput label={t("common.name")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        <FormInput label={t("auto.k342616c4fb")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        <FormInput label={t("common.mobile")} value={mobile} readOnly />
                        <FormInput label={t("common.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <Button type="submit" size="lg" className="w-full" isPending={loading}>
                          {needsPasswordSetup ? "تکمیل و ورود" : "ثبت‌نام"}
                        </Button>
                      </form>
                    ) : null}

                    {step === "signin" ? (
                      <form className="mt-10 space-y-6" onSubmit={(e) => void handleSignIn(e)}>
                        <FormInput label={t("common.mobile")} value={mobile} readOnly />
                        {usePassword ? (
                          <FormInput label={t("common.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        ) : (
                          <>
                            <OtpCodeField label={t("auto.ka8ac5bb350")} value={code} onChange={setCode} />
                            <Button type="button" variant="secondary" className="w-full" onPress={() => void requestCode()}>
                              <Sms size={16} />
                              ارسال کد به تلگرام
                            </Button>
                          </>
                        )}
                        {usePassword && hasPassword ? (
                          <button
                            type="button"
                            className="text-sm text-accent transition-colors hover:underline"
                            onClick={() => {
                              setStep("reset");
                              setError("");
                            }}
                          >
                            فراموشی رمز عبور؟
                          </button>
                        ) : null}
                        {hasPassword && hasTelegram ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full"
                            onPress={() => setUsePassword((v) => !v)}
                          >
                            {usePassword ? "ورود با کد تلگرام" : "ورود با رمز عبور"}
                          </Button>
                        ) : null}
                        <Button type="submit" size="lg" className="w-full" isPending={loading}>
                          <Login size={18} />
                          ورود
                        </Button>
                      </form>
                    ) : null}

                    {step === "reset" ? (
                      <ForgotPasswordStep
                        mobile={mobile}
                        onBack={() => {
                          setStep("signin");
                          setError("");
                        }}
                        onSuccess={() => {
                          setPassword("");
                          setStep("signin");
                        }}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>

              <p className="mt-6 text-center text-xs leading-6 text-muted">
                با ادامه، شرایط استفاده از {APP_NAME_FA} را می‌پذیرید.
              </p>

              <p className="mt-3 text-center lg:hidden">
                <Link href={PATHS.LANDING} className="text-sm text-muted transition-colors hover:text-foreground">
                  بازگشت به سایت
                </Link>
              </p>

              <SiteFooterCredits className="mt-8 justify-center" />
            </div>
          </div>
        </main>

        <aside className="relative order-1 hidden overflow-hidden lg:order-2 lg:flex lg:items-center lg:justify-center lg:p-10 xl:p-14">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/14 via-violet-500/8 to-teal-500/10" />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, black 20%, transparent 75%)",
            }}
          />

          <div className="relative flex w-full max-w-lg flex-col gap-10 xl:max-w-xl xl:gap-12">
            <Link href={PATHS.LANDING}>
              <AppLogo size={52} />
            </Link>

            <div>
              <h2 className="text-3xl font-bold leading-snug xl:text-4xl xl:leading-tight">
                مدیریت مالی شخصی
                <span className="mt-3 block bg-gradient-to-l from-[var(--brand-rose)] via-[var(--brand-violet)] to-[var(--brand-teal)] bg-clip-text text-transparent">
                  ساده، دقیق و شمسی
                </span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-8 text-muted">{APP_TAGLINE_FA}</p>
            </div>

            <ul className="space-y-3">
              {BRAND_FEATURES.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-4 rounded-2xl border border-border/60 bg-surface/80 px-5 py-4 backdrop-blur-sm"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                    <Icon size={20} variant="Bold" />
                  </span>
                  <span className="text-base leading-7">{text}</span>
                </li>
              ))}
            </ul>

            <Link
              href={PATHS.LANDING}
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <ArrowRight2 size={16} />
              بازگشت به سایت
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
