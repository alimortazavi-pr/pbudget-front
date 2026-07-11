"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";
import { Switch } from "@heroui/react";
import { Microphone2 } from "iconsax-reactjs";
import { useVoiceAssistantPreference } from "@/components/providers/VoiceAssistantPreferenceProvider";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export function VoiceAssistantSection() {
  const { t } = useTranslation();
  const { enabled, setEnabled, mounted } = useVoiceAssistantPreference();
  const user = useAppSelector(userSelector);
  const isAdmin = user?.mobile === "09125519818";

  if (!mounted) {
    return (
      <div className="glass rounded-2xl p-5">
        <div className="pb-shimmer h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="glass space-y-4 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Microphone2 size={20} variant="Bold" />
            </span>
            <h2 className="text-lg font-bold">
              {t("voice.title")} {!isAdmin && <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full font-medium ms-2">بزودی</span>}
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            {isAdmin 
              ? t("auto.k8c7e03d433") + " " + t("auto.k343bb8ee04")
              : "دستیار صوتی به‌زودی فعال می‌شود. در حال حاضر این قابلیت غیرفعال است و فقط با شماره ادمین کار می‌کند."}
          </p>
        </div>
        <Switch
          isSelected={isAdmin ? enabled : false}
          onChange={isAdmin ? setEnabled : undefined}
          isDisabled={!isAdmin}
          size="sm"
          aria-label={t("auto.kcb5c1989db")}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>
    </div>
  );
}
