import { PATHS } from "@/common/constants";
import { storage } from "./storage";

export function forceAuthLogout() {
  storage.clearAuthData();
  if (typeof window !== "undefined") {
    window.location.href = PATHS.GET_STARTED;
  }
}
