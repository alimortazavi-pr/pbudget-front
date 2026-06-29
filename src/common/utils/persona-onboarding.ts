const PENDING_PERSONA_KEY = "pbudget-pending-persona-tour";

export type PersonaKind =
  | "personal"
  | "business"
  | "attendance"
  | "admin"
  | "invites";

export function queuePersonaOnboarding(kind: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizePersonaKind(kind);
  if (!normalized) return;
  sessionStorage.setItem(PENDING_PERSONA_KEY, normalized);
}

export function consumePendingPersonaTour(): PersonaKind | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_PERSONA_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PENDING_PERSONA_KEY);
  return normalizePersonaKind(raw);
}

export function peekPendingPersonaTour(): PersonaKind | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_PERSONA_KEY);
  return raw ? normalizePersonaKind(raw) : null;
}

function normalizePersonaKind(kind: string): PersonaKind | null {
  if (
    kind === "personal" ||
    kind === "business" ||
    kind === "attendance" ||
    kind === "admin" ||
    kind === "invites"
  ) {
    return kind;
  }
  return null;
}
