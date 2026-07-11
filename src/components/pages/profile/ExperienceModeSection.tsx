"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useRouter } from "next/navigation";
import { Element4, Calendar } from "iconsax-reactjs";

import {
  EXPERIENCE_MODES,
  type ExperienceMode,
} from "@/common/constants/experience";
import { PATHS } from "@/common/constants";
import { useExperience } from "@/components/providers/ExperienceProvider";

export function ExperienceModeSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const { experienceMode, setExperienceMode, mounted } = useExperience();

  function selectMode(mode: ExperienceMode) {
    if (mode === experienceMode) return;
    setExperienceMode(mode);
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
    <div className="glass space-y-4 rounded-2xl p-5">
      <div>
        <h2 className="text-lg font-bold">{t("common.displayMode")}</h2>
        <p className="mt-1 text-sm text-muted">
          {t("common.displayModeDesc")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {EXPERIENCE_MODES.map((mode) => {
          const active = experienceMode === mode.id;
          const Icon = mode.id === "classic" ? Element4 : Calendar;

          return (
            <button
              key={mode.id}
              type="button"
              className="pb-experience-card"
              data-active={active ? "true" : "false"}
              onClick={() => selectMode(mode.id)}
            >
              <span className="pb-experience-card-icon">
                <Icon size={24} variant={active ? "Bold" : "Linear"} />
              </span>
              <span className="block text-start">
                <span className="block text-sm font-semibold">{t(mode.labelKey)}</span>
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
