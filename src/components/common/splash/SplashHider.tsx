"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Lifts the splash once the page is interactive (or after a short cap). */
export function SplashHider() {
  const pathname = usePathname();
  const liftRef = useRef<(() => void) | null>(null);
  const startPath = useRef<string | null>(null);

  // A signed-in visitor on "/" is about to be sent to the app: keep the splash
  // up until that navigation happens, so the landing page never flashes.
  useEffect(() => {
    if (startPath.current === null) startPath.current = pathname;
    else if (pathname !== startPath.current) liftRef.current?.();
  }, [pathname]);

  useEffect(() => {
    const root = document.documentElement;
    let done = false;
    const signedInOnLanding =
      window.location.pathname === "/" && /(?:^|; )pdesk-personal-auth=/.test(document.cookie) && !window.location.hash;
    const lift = () => {
      if (done) return;
      done = true;
      // two frames: let the first real paint happen under the splash
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          root.dataset.ready = "true";
          window.setTimeout(() => document.getElementById("pb-splash")?.remove(), 700);
        }),
      );
    };
    liftRef.current = lift;
    const cap = window.setTimeout(lift, signedInOnLanding ? 3500 : 1800);
    if (!signedInOnLanding) {
      if (document.readyState === "complete") lift();
      else window.addEventListener("load", lift, { once: true });
    }
    return () => {
      window.clearTimeout(cap);
      window.removeEventListener("load", lift);
    };
  }, []);
  return null;
}
