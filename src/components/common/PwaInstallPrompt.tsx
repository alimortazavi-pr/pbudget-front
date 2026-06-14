"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { CloseCircle, ExportSquare } from "iconsax-reactjs";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pbudget-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
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
      <div className="glass flex items-start gap-3 rounded-2xl border border-white/20 p-4 shadow-xl">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-500">
          <ExportSquare size={22} variant="Bold" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold text-foreground">نصب Paradise Budget</p>
            <p className="mt-1 text-sm text-muted">
              اپ را روی گوشی یا دسکتاپ نصب کنید و مثل برنامه native بازش کنید.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="primary"
              onPress={install}
              isDisabled={installing}
            >
              {installing ? "در حال نصب…" : "نصب اپ"}
            </Button>
            <Button size="sm" variant="ghost" onPress={dismiss}>
              بعداً
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
