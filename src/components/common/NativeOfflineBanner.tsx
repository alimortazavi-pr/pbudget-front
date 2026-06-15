"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";

/**
 * نوار وضعیت آفلاین — فقط در اپ نیتیو نمایش داده می‌شود.
 */
export function NativeOfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const sync = async () => {
      const status = await Network.getStatus();
      if (!cancelled) setOffline(!status.connected);
    };

    void sync();
    const handle = Network.addListener("networkStatusChange", (status) => {
      setOffline(!status.connected);
    });

    return () => {
      cancelled = true;
      void handle.then((h) => h.remove());
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[9999] bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      اتصال اینترنت برقرار نیست
    </div>
  );
}
