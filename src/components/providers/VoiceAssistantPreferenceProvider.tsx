"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from "react";

import {
  getVoiceAssistantEnabled,
  setVoiceAssistantEnabled,
} from "@/common/utils/voice-assistant-preference";

type VoiceAssistantPreferenceContextValue = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  mounted: boolean;
};

const VoiceAssistantPreferenceContext =
  createContext<VoiceAssistantPreferenceContextValue | null>(null);

export const VoiceAssistantPreferenceProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const [enabled, setEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabledState(getVoiceAssistantEnabled());
    setMounted(true);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    setVoiceAssistantEnabled(next);
  }, []);

  const value = useMemo(
    () => ({ enabled, setEnabled, mounted }),
    [enabled, setEnabled, mounted],
  );

  return (
    <VoiceAssistantPreferenceContext.Provider value={value}>
      {children}
    </VoiceAssistantPreferenceContext.Provider>
  );
};

export function useVoiceAssistantPreference() {
  const ctx = useContext(VoiceAssistantPreferenceContext);
  if (!ctx) {
    throw new Error(
      "useVoiceAssistantPreference must be used within VoiceAssistantPreferenceProvider",
    );
  }
  return ctx;
}
