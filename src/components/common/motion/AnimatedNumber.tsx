"use client";

import { useEffect, useRef, useState } from "react";

type AnimatedNumberProps = {
  value: number;
  /** Turns the in-between number into display text (digits, separators, unit). */
  format: (value: number) => string;
  durationMs?: number;
  className?: string;
  /** Start value on mount (e.g. 0 to count up on first paint). Defaults to `value`. */
  from?: number;
};

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Counts from the previous value to the new one, so balances "settle" instead
 * of jumping. Renders the final value immediately for reduced motion and on
 * the server (no hydration mismatch).
 */
export function AnimatedNumber({ value, format, durationMs = 900, className, from }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(from ?? value);
  const fromRef = useRef(from ?? value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === value || !Number.isFinite(value)) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const progress = easeOutExpo(Math.min(1, (now - start) / durationMs));
      const current = from + (value - from) * progress;
      setDisplay(progress >= 1 ? value : Math.round(current));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else fromRef.current = value;
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, durationMs]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {format(display)}
    </span>
  );
}
