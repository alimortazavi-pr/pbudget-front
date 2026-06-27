import { APP_VERSION } from "@/common/constants/app-version";

const LAST_SEEN_KEY = "pbudget-last-seen-version";
const ONBOARDING_KEY = "pbudget-onboarding-done";
const TOUR_PREFIX = "pbudget-tour-done-";

export function getLastSeenVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SEEN_KEY);
}

export function setLastSeenVersion(version: string) {
  localStorage.setItem(LAST_SEEN_KEY, version);
}

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function setOnboardingDone() {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

export function isTourDone(tourId: string): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(`${TOUR_PREFIX}${tourId}`) === "1";
}

export function setTourDone(tourId: string) {
  localStorage.setItem(`${TOUR_PREFIX}${tourId}`, "1");
}

export function resetTour(tourId: string) {
  localStorage.removeItem(`${TOUR_PREFIX}${tourId}`);
}

export function getCurrentAppVersion() {
  return APP_VERSION;
}
