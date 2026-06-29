"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@heroui/react";
import { CloseCircle } from "iconsax-reactjs";

import { APP_NAME_FA } from "@/common/constants/brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SEEN_KEY = "pbudget-pwa-install-seen";
const ATTENDANCE_SEEN_KEY = "pbudget-pwa-attendance-seen";

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const isAttendancePortal = /\/business\/[^/]+\/attendance\/me/.test(pathname);

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  const seenKey = isAttendancePortal ? ATTENDANCE_SEEN_KEY : SEEN_KEY;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(seenKey) === "1" && !isAttendancePortal) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (localStorage.getItem(seenKey) === "1" && !isAttendancePortal) return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      localStorage.setItem(seenKey, "1");
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [seenKey, isAttendancePortal]);

  useEffect(() => {
    if (!isAttendancePortal) return;
    if (localStorage.getItem(ATTENDANCE_SEEN_KEY) === "1") return;
    const timer = window.setTimeout(() => {
      if (!deferredPrompt) {
        setVisible(true);
      }
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [isAttendancePortal, deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem(seenKey, "1");
    setVisible(false);
  }, [seenKey]);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      dismiss();
      return;
    }
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem(seenKey, "1");
        setVisible(false);
      } else {
        dismiss();
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, dismiss, seenKey]);

  if (!visible) return null;

  const title = isAttendancePortal
    ? "نصب اپ حضور و غیاب"
    : `نصب ${APP_NAME_FA}`;
  const description = isAttendancePortal
    ? "برای ثبت سریع ورود و خروج با GPS، اپ را روی صفحه اصلی گوشی نصب کنید — مثل اپ native."
    : "اپ را روی گوشی یا دسکتاپ نصب کنید و مثل برنامه native بازش کنید.";

  return (
    <div
      className={`fixed inset-x-4 z-[60] mx-auto max-w-lg md:left-auto md:right-6 ${
        isAttendancePortal
          ? "bottom-4 md:bottom-6"
          : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6"
      }`}
      data-tour="attendance-pwa"
    >
      <div className="glass flex items-start gap-3 rounded-2xl border border-border/50 p-4 shadow-xl">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          <Image
            src="/assets/logo-mark.svg"
            alt=""
            width={44}
            height={44}
            className="size-11"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {deferredPrompt ? (
              <Button
                size="sm"
                variant="primary"
                onPress={install}
                isDisabled={installing}
              >
                {installing ? "در حال نصب…" : "نصب اپ"}
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onPress={dismiss}>
              {deferredPrompt ? "بعداً" : "متوجه شدم"}
            </Button>
          </div>
        </div>
        <button
          type="button"
          aria-label="بستن"
          className="shrink-0 text-muted transition hover:text-foreground"
          onClick={dismiss}
        >
          <CloseCircle size={20} />
        </button>
      </div>
    </div>
  );
}
