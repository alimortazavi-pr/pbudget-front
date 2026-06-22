import { PATHS } from "@/common/constants/PATHS";

/** Routes accessible without authentication */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === PATHS.GET_STARTED ||
    pathname === PATHS.DOWNLOAD ||
    pathname.startsWith("/partner-invite/")
  );
}
