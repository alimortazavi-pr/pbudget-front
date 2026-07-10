"use client";

import {
  useLanguage,
  useTranslation,
  type Language,
} from "@/components/providers/LanguageProvider";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_MIN_WIDTH = 120;

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const options: { value: Language; labelKey: string; flag: string }[] = [
    { value: "fa", labelKey: "common.languagePersian", flag: "🇮🇷" },
    { value: "ar", labelKey: "common.languageArabic", flag: "🇸🇦" },
    { value: "en", labelKey: "common.languageEnglish", flag: "🇬🇧" },
  ];

  const currentOpt = options.find((o) => o.value === language) || options[0];

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";
    const left = isRtl
      ? rect.left
      : Math.max(8, rect.right - MENU_MIN_WIDTH);

    setMenuPosition({
      top: rect.bottom + 4,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const menu =
    isOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: 9999,
              minWidth: MENU_MIN_WIDTH,
            }}
            className="rounded-xl border border-border/40 bg-background p-1 shadow-lg"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                data-testid={`language-option-${opt.value}`}
                aria-selected={language === opt.value}
                onClick={() => {
                  setLanguage(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-surface-secondary ${
                  language === opt.value
                    ? "bg-accent/10 font-medium text-accent"
                    : "text-foreground"
                }`}
                style={{ direction: opt.value === "en" ? "ltr" : "rtl" }}
              >
                <span>{opt.flag}</span>
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-testid="language-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-w-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-secondary"
      >
        <span>{currentOpt.flag}</span>
        <span className="hidden sm:inline">{t(currentOpt.labelKey)}</span>
      </button>
      {menu}
    </>
  );
}
