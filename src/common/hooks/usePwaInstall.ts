"use client";

import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let attached = false;

function attach() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  });
}

/**
 * Lets any button install the site as a PWA. Chromium browsers expose a real
 * install prompt; iOS Safari has none, so `isIos` lets the UI show the
 * "Add to Home Screen" hint instead.
 */
export function usePwaInstall() {
  const [, tick] = useState(0);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    attach();
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as unknown as { standalone?: boolean }).standalone),
    );
    setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return false;
    const evt = deferred;
    deferred = null;
    listeners.forEach((fn) => fn());
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    return outcome === "accepted";
  }, []);

  return { canInstall: Boolean(deferred) && !standalone, isIos: isIos && !standalone, standalone, install };
}
