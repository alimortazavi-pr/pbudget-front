/** Shared cookie options for *.pdesk.ir subdomains */
export function getCookieOptions() {
  const domain =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith("pdesk.ir")
      ? ".pdesk.ir"
      : undefined;

  return {
    path: "/",
    ...(domain ? { domain } : {}),
  } as const;
}
