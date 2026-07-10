"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { CloseCircle } from "iconsax-reactjs";

import { APP_NAME_FA } from "@/common/constants/brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const SEEN_KEY = "pbudget-pwa-install-seen";

export function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(SEEN_KEY) === "1") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      if (localStorage.getItem(SEEN_KEY) === "1") return;
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      localStorage.setItem(SEEN_KEY, "1");
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  }, []);

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
        localStorage.setItem(SEEN_KEY, "1");
        setVisible(false);
      } else {
        dismiss();
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, dismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto max-w-lg md:bottom-6 md:left-auto md:right-6">
      <div className="glass flex items-start gap-3 rounded-2xl border border-border/50 p-4 shadow-xl">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          <Image
            src="/assets/logo-mark.png"
            alt=""
            width={44}
            height={44}
            className="size-11"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold text-foreground">نصب {APP_NAME_FA}</p>
            <p className="mt-1 text-sm text-muted">
              اپ را روی گوشی یا دسکتاپ نصب کنید و مثل برنامه native بازش کنید.
            </p>
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
          aria-label={t("بستن")}
          className="shrink-0 text-muted transition hover:text-foreground"
          onClick={dismiss}
        >
          <CloseCircle size={20} />
        </button>
      </div>
    </div>
  );
}
