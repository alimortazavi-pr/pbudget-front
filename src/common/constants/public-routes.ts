import { PATHS } from "@/common/constants/PATHS";

/** Routes accessible without authentication */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === PATHS.LANDING ||
    pathname === PATHS.PRICING ||
    pathname === PATHS.GET_STARTED ||
    pathname === PATHS.DOWNLOAD ||
    pathname.startsWith("/partner-invite/") ||
    pathname.startsWith("/business-invite/")
  );
}
