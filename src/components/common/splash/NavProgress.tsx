"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Thin top bar while a client-side navigation is in flight. */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [state, setState] = useState<"idle" | "run" | "done">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = (event.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      window.clearTimeout(timer.current);
      setState("run");
      // never leave the bar hanging
      timer.current = window.setTimeout(() => setState("done"), 8000);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setState((current) => (current === "run" ? "done" : current));
    const id = window.setTimeout(() => setState("idle"), 500);
    return () => window.clearTimeout(id);
  }, [pathname, search]);

  return <span aria-hidden className="pb-navbar" data-state={state} />;
}
