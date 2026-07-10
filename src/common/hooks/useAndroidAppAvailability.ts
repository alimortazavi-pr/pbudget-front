"use client";

import { useEffect, useState } from "react";

import { fetchAndroidAppInfo } from "@/common/api/app";
import type { AndroidAppInfo } from "@/common/interfaces/app.interface";

const FALLBACK_APK_URL = process.env.NEXT_PUBLIC_APK_URL;

let cached: AndroidAppInfo | null = null;
let inflight: Promise<AndroidAppInfo | null> | null = null;

async function loadAndroidAppInfo(): Promise<AndroidAppInfo | null> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetchAndroidAppInfo()
      .then((info) => {
        cached = info;
        return info;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Whether the public download page should be promoted (APK on server or dev fallback). */
export function useAndroidAppAvailability() {
  const [info, setInfo] = useState<AndroidAppInfo | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    void loadAndroidAppInfo().then((data) => {
      if (cancelled) return;
      setInfo(data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const apkAvailable = Boolean(info?.available);
  const hasDevFallback = Boolean(FALLBACK_APK_URL);
  const showDownloadPromo = apkAvailable || hasDevFallback;

  return {
    info,
    loading,
    apkAvailable,
    showDownloadPromo,
    versionName: info?.versionName,
    downloadUrl: info?.downloadUrl,
  };
}
