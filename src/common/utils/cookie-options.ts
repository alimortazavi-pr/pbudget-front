/** Host-only cookie options. Personal and Business must never share sessions. */
export function getCookieOptions() {
  return { path: "/" } as const;
}
