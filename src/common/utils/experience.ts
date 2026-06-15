import jsCookies from "js-cookie";

import {
  EXPERIENCE_COOKIE,
  type ExperienceMode,
} from "@/common/constants/experience";

export function getStoredExperience(): ExperienceMode {
  const saved = jsCookies.get(EXPERIENCE_COOKIE);
  if (saved === "timeline" || saved === "classic") return saved;
  return "classic";
}

export function setStoredExperience(mode: ExperienceMode) {
  jsCookies.set(EXPERIENCE_COOKIE, mode, { expires: 365, path: "/" });
}
