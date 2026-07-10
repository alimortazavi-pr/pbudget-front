"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type FullscreenOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
};

export function FullscreenOverlay({
  open,
  onClose,
  children,
  title,
}: FullscreenOverlayProps) {  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex h-dvh flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? t("common.fullscreen")}
    >
      {children}
    </div>,
    document.body,
  );
}
