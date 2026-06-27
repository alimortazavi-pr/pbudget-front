import { VOICE_ASSISTANT_STORAGE_KEY } from "@/common/constants/voice-assistant";

export function getVoiceAssistantEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(VOICE_ASSISTANT_STORAGE_KEY) !== "0";
}

export function setVoiceAssistantEnabled(enabled: boolean) {
  localStorage.setItem(VOICE_ASSISTANT_STORAGE_KEY, enabled ? "1" : "0");
}
