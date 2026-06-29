"use client";

import { useCallback, useState } from "react";

type GeoPosition = {
  lat: number;
  lng: number;
};

type UseGeolocationResult = {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  requestPosition: () => Promise<GeoPosition | null>;
};

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPosition = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("مرورگر از GPS پشتیبانی نمی‌کند");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise<GeoPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setPosition(next);
          setLoading(false);
          resolve(next);
        },
        (err) => {
          const message =
            err.code === err.PERMISSION_DENIED
              ? "دسترسی به موقعیت مکانی رد شد"
              : "دریافت موقعیت مکانی ناموفق بود";
          setError(message);
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    });
  }, []);

  return { position, error, loading, requestPosition };
}
