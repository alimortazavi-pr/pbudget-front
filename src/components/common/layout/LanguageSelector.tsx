"use client";

import {
  useLanguage,
  useTranslation,
  type Language,
} from "@/components/providers/LanguageProvider";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const MENU_MIN_WIDTH = 132;
const MENU_ITEM_HEIGHT = 36;
const MENU_PADDING = 8;
const MENU_Z_INDEX = 10_100;

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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
  const menuHeight = options.length * MENU_ITEM_HEIGHT + MENU_PADDING;

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";
    const isMobile = window.matchMedia("(max-width: 1023px)").matches;
    const left = isRtl
      ? rect.left
      : Math.max(8, rect.right - MENU_MIN_WIDTH);

    // On mobile the dashboard hero sits directly under the header; open upward.
    const openUpward = isMobile || rect.bottom + menuHeight > window.innerHeight - 16;
    const top = openUpward
      ? Math.max(8, rect.top - menuHeight - 4)
      : rect.bottom + 4;

    setMenuPosition({ top, left });
  }, [menuHeight]);

  useEffect(() => {
    setMounted(true);
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
    mounted && isOpen && menuPosition
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            data-language-menu=""
            style={{
              position: "fixed",
              top: menuPosition.top,
              left: menuPosition.left,
              zIndex: MENU_Z_INDEX,
              minWidth: MENU_MIN_WIDTH,
              isolation: "isolate",
            }}
            className="rounded-xl border border-border/60 bg-surface p-1 shadow-2xl ring-1 ring-black/5"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="option"
                data-testid={`language-option-${opt.value}`}
                aria-selected={language === opt.value}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => {
                  setLanguage(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-secondary ${
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
