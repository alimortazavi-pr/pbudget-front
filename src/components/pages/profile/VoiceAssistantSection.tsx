"use client";

import { Switch } from "@heroui/react";
import { Microphone2 } from "iconsax-reactjs";

import { useVoiceAssistantPreference } from "@/components/providers/VoiceAssistantPreferenceProvider";

export function VoiceAssistantSection() {
  const { enabled, setEnabled, mounted } = useVoiceAssistantPreference();

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
            <h2 className="text-lg font-bold">دستیار صوتی</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            دکمه شناور میکروفون در تمام صفحات — تراکنش، تسک، یادداشت،
            بدهی، چک، اقساط و بیشتر را با صدا یا متن ثبت کنید.
          </p>
        </div>
        <Switch
          isSelected={enabled}
          onChange={setEnabled}
          size="sm"
          aria-label="نمایش دستیار صوتی"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>
    </div>
  );
}
