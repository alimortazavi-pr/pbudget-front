"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";

function currentThemeIsDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

let statusBarReady = false;

async function syncStatusBar() {
  if (Capacitor.getPlatform() !== "android" && Capacitor.getPlatform() !== "ios") {
    return;
  }
  const dark = currentThemeIsDark();
  try {
    // یک‌بار: WebView زیر status bar کشیده شود تا inset ها از env() قابل استفاده باشند.
    if (!statusBarReady) {
      statusBarReady = true;
      await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => undefined);
    }
    // آیکن‌های روشن روی تم تیره، تیره روی تم روشن.
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    // در اندروید ۱۵+ (edge-to-edge) no-op است؛ روی نسخه‌های قدیمی‌تر پس‌زمینه را ست می‌کند.
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({
        color: dark ? "#1f2937" : "#ffffff",
      }).catch(() => undefined);
    }
  } catch {
    /* بی‌اهمیت: روی برخی دستگاه‌ها بعضی APIها no-op هستند */
  }
}

/**
 * پل بین اپ وب و قابلیت‌های نیتیو اندروید/iOS.
 * روی نسخه‌ی وب (مرورگر) هیچ کاری نمی‌کند و null برمی‌گرداند.
 */
export function NativeBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const root = document.documentElement;
    root.classList.add("cap-native");

    // در اپ نیتیو، کش/سرویس‌ورکرِ PWA لازم نیست و با لایه‌ی لوکال کاپاسیتور تداخل دارد.
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => undefined);
    }

    // اسپلش را پس از آماده‌شدن اولین فریم ببند (بدون پرش/فلش سفید).
    const splashTimer = window.setTimeout(() => {
      SplashScreen.hide().catch(() => undefined);
    }, 200);

    // status bar اولیه و همگام با تغییر تم (light/dark).
    void syncStatusBar();
    const themeObserver = new MutationObserver(() => void syncStatusBar());
    themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // دکمه‌ی back سخت‌افزاری اندروید: عقب‌رفتن در تاریخچه یا خروج از اپ در ریشه.
    const backHandlePromise = CapApp.addListener(
      "backButton",
      ({ canGoBack }) => {
        if (canGoBack && window.history.length > 1) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      },
    );

    // وضعیت کیبورد برای تنظیم چیدمان (مخفی‌کردن tab bar هنگام تایپ).
    const showPromise = Keyboard.addListener("keyboardWillShow", () => {
      root.classList.add("keyboard-open");
    });
    const hidePromise = Keyboard.addListener("keyboardWillHide", () => {
      root.classList.remove("keyboard-open");
    });

    return () => {
      window.clearTimeout(splashTimer);
      themeObserver.disconnect();
      void backHandlePromise.then((h) => h.remove());
      void showPromise.then((h) => h.remove());
      void hidePromise.then((h) => h.remove());
    };
  }, []);

  return null;
}
