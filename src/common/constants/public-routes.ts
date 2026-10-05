import { PATHS } from "@/common/constants/PATHS";

/** Routes accessible without authentication */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === PATHS.LANDING ||
    pathname === PATHS.PRICING ||
    pathname === PATHS.GET_STARTED ||
    pathname === PATHS.DOWNLOAD ||
    pathname === "/learn" ||
    pathname.startsWith("/learn/") ||
    pathname.startsWith("/partner-invite/")
  );
}
