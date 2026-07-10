"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Button } from "@heroui/react";
import { Moon, Sun1 } from "iconsax-reactjs";

import { useTheme } from "@/components/providers/ThemeProvider";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) return <div className="size-9" />;

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={t("common.changeTheme")}
      onPress={toggleTheme}
      className="text-muted"
    >
      {theme === "dark" ? <Sun1 size={18} /> : <Moon size={18} />}
    </Button>
  );
}
