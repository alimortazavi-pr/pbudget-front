"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Wraps text that may be cut with "…" on small screens. Hover shows the full
 * value (native title) and a click/tap opens a small bubble with all of it, so
 * no amount is ever unreadable.
 */
export function OverflowReveal({
  full,
  children,
  className = "",
}: {
  full: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const target = (el.firstElementChild as HTMLElement | null) ?? el;
    setOverflowing(target.scrollWidth > target.clientWidth + 1 || el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, full]);

  useEffect(() => {
    if (!rect) return;
    const close = () => setRect(null);
    const timer = window.setTimeout(close, 4000);
    window.addEventListener("pointerdown", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("keydown", close);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("keydown", close);
    };
  }, [rect]);

  return (
    <>
      <span
        ref={ref}
        title={overflowing ? full : undefined}
        onClick={(event) => {
          if (!overflowing) return;
          event.stopPropagation();
          setRect(ref.current?.getBoundingClientRect() ?? null);
        }}
        className={`block min-w-0 ${overflowing ? "cursor-help" : ""} ${className}`}
      >
        {children}
      </span>
      {rect && typeof document !== "undefined"
        ? createPortal(
            <div
              role="tooltip"
              className="pb-pop pointer-events-none fixed z-[100001] max-w-[min(90vw,22rem)] break-words rounded-xl bg-foreground px-3 py-2 text-sm font-bold text-background shadow-2xl"
              style={{
                top: Math.min(rect.bottom + 8, window.innerHeight - 56),
                left: Math.max(8, Math.min(rect.left + rect.width / 2, window.innerWidth - 8)),
                transform: "translateX(-50%)",
              }}
            >
              {full}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
