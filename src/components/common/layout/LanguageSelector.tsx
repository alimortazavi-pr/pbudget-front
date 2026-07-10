"use client";

import { useLanguage, useTranslation, type Language } from "@/components/providers/LanguageProvider";
import { Popover, Button } from "@heroui/react";
import { useState } from "react";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const options: { value: Language; labelKey: string; flag: string }[] = [
    { value: "fa", labelKey: "common.languagePersian", flag: "🇮🇷" },
    { value: "ar", labelKey: "common.languageArabic", flag: "🇸🇦" },
    { value: "en", labelKey: "common.languageEnglish", flag: "🇬🇧" },
  ];

  const currentOpt = options.find((o) => o.value === language) || options[0];

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Button
          variant="ghost"
          size="sm"
          className="min-w-0 px-2 text-xs font-semibold hover:bg-surface-secondary gap-1"
        >
          <span>{currentOpt.flag}</span>
          <span className="hidden sm:inline">{t(currentOpt.labelKey)}</span>
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="bottom end" className="p-1 min-w-[120px] bg-background border border-border/40 shadow-lg rounded-xl">
        <Popover.Dialog>
          <div className="flex flex-col gap-0.5">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setLanguage(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-1.5 text-right text-sm rounded-lg transition-colors hover:bg-surface-secondary ${
                  language === opt.value
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-foreground"
                }`}
                style={{ direction: opt.value === "en" ? "ltr" : "rtl" }}
              >
                <span>{opt.flag}</span>
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
