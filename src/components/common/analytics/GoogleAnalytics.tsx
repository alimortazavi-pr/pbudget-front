"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-X5F9RKXJRL";

/** Hide private tokens / ids before they reach Google. */
function sanitizePath(path: string): string {
  return path
    .replace(/^\/partner-invite\/[^/]+/, "/partner-invite/:token")
    .replace(/^(\/admin\/users)\/[^/]+/, "$1/:id");
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || typeof window.gtag !== "function") return;
    const page_path = sanitizePath(pathname);
    window.gtag("event", "page_view", {
      page_path,
      page_location: window.location.origin + page_path,
      page_title: document.title,
    });
  }, [pathname]);

  if (!GA_ID) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA_ID}',{send_page_view:false});`}
      </Script>
    </>
  );
}
