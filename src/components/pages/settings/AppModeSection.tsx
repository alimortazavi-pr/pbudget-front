"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useRouter } from "next/navigation";
import { Book1, Calendar1, CommandSquare, Setting4 } from "iconsax-reactjs";

import { APP_MODES, type AppMode } from "@/common/constants/app-mode";
import { PATHS } from "@/common/constants";
import { useAppMode } from "@/components/providers/AppModeProvider";

export function AppModeSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { appMode, setAppMode, mounted } = useAppMode();

  function selectMode(mode: AppMode) {
    if (mode === appMode) return;
    setAppMode(mode);
    router.push(PATHS.HOME);
  }

  if (!mounted) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="pb-shimmer h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="glass space-y-4 rounded-2xl p-5" data-tour="settings-app-mode">
      <div>
        <h2 className="text-lg font-bold">{t("common.appMode")}</h2>
        <p className="mt-1 text-sm text-muted">{t("common.appModeDesc")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {APP_MODES.map((mode) => {
          const active = appMode === mode.id;
          const Icon =
            mode.id === "advanced"
              ? Setting4
              : mode.id === "calendar"
                ? Calendar1
                : mode.id === "command"
                  ? CommandSquare
                  : Book1;

          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={active}
              aria-label={t(mode.labelKey)}
              className="pb-experience-card"
              data-active={active ? "true" : "false"}
              onClick={() => selectMode(mode.id)}
            >
              <span className="pb-experience-card-icon">
                <Icon size={24} variant={active ? "Bold" : "Linear"} />
              </span>
              <span className="block text-start">
                <span className="block text-sm font-semibold">
                  {t(mode.labelKey)}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted">
                  {t(mode.descriptionKey)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
