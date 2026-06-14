export function chipClass(active: boolean) {
  return `cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium transition ${
    active
      ? "border-accent bg-accent/10 text-accent"
      : "border-border bg-surface text-muted"
  }`;
}
