"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Bottom action bar for bulk selections. Rendered on document.body because
 * page wrappers use transforms, which would pin a `fixed` bar to the page
 * instead of the screen. Sits above the mobile tab bar.
 */
export function FloatingActionBar({ label, children }: { label: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div
      role="region"
      aria-label={label}
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[45] mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 bg-surface/95 p-3 shadow-xl backdrop-blur lg:bottom-6"
    >
      {children}
    </div>,
    document.body,
  );
}
