const LAST_WORKSPACE_KEY = "pbudget-last-workspace";

export type SavedWorkspace = {
  path: string;
  kind: string;
  label: string;
  savedAt: number;
};

export function saveLastWorkspace(input: Omit<SavedWorkspace, "savedAt">) {
  if (typeof window === "undefined") return;
  const payload: SavedWorkspace = { ...input, savedAt: Date.now() };
  localStorage.setItem(LAST_WORKSPACE_KEY, JSON.stringify(payload));
}

export function getLastWorkspace(): SavedWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_WORKSPACE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedWorkspace;
  } catch {
    return null;
  }
}

export function clearLastWorkspace() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LAST_WORKSPACE_KEY);
}
