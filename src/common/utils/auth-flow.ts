import { PATHS } from "@/common/constants";

const ALLOWED_PREFIXES = [
  PATHS.HOME,
  PATHS.ADMIN,
  PATHS.INVITES,
  "/partner-invite",
  PATHS.PROJECTS,
  PATHS.LANDING,
] as const;

export const AUTH_RETURN_STORAGE_KEY = "pbudget-auth-return";
const AUTH_MODE_QUERY_KEY = "mode";
const ADD_ACCOUNT_MODE = "add-account";

export function isAddAccountFlow(
  searchParams: Pick<URLSearchParams, "get">,
): boolean {
  return searchParams.get(AUTH_MODE_QUERY_KEY) === ADD_ACCOUNT_MODE;
}

export function buildAddAccountUrl(): string {
  return `${PATHS.GET_STARTED}?${AUTH_MODE_QUERY_KEY}=${ADD_ACCOUNT_MODE}`;
}

export function validateAuthReturnUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return null;
  if (url === PATHS.GET_STARTED || url === PATHS.LANDING) return null;
  const ok = ALLOWED_PREFIXES.some(
    (p) => url === p || url.startsWith(`${p}/`),
  );
  return ok ? url : null;
}

export function saveAuthReturnUrl(url: string) {
  const valid = validateAuthReturnUrl(url);
  if (valid) sessionStorage.setItem(AUTH_RETURN_STORAGE_KEY, valid);
}

export function peekAuthReturnUrl(): string | null {
  return validateAuthReturnUrl(sessionStorage.getItem(AUTH_RETURN_STORAGE_KEY));
}

export function consumeAuthReturnUrl(): string | null {
  const v = peekAuthReturnUrl();
  sessionStorage.removeItem(AUTH_RETURN_STORAGE_KEY);
  return v;
}

export function buildGetStartedUrl(returnPath?: string) {
  const valid = validateAuthReturnUrl(returnPath ?? null);
  if (!valid) return PATHS.GET_STARTED;
  return `${PATHS.GET_STARTED}?return=${encodeURIComponent(valid)}`;
}
