import { PATHS } from "@/common/constants";

const SIMPLE_ALLOWED_PREFIXES = [
  PATHS.HOME,
  PATHS.CREATE_BUDGET,
  "/budgets/",
  PATHS.BOXES,
  PATHS.CATEGORIES,
  PATHS.PROFILE,
  PATHS.SETTINGS,
  PATHS.DOWNLOAD,
] as const;

export function isPathAllowedInSimpleMode(pathname: string) {
  return SIMPLE_ALLOWED_PREFIXES.some((prefix) => {
    if (prefix === PATHS.HOME) return pathname === PATHS.HOME;
    if (prefix === PATHS.PROFILE) {
      return pathname === PATHS.PROFILE;
    }
    return pathname === prefix || pathname.startsWith(prefix);
  });
}
