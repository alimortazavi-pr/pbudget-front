export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto flex min-h-[55vh] max-w-5xl items-center justify-center px-5">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span aria-hidden="true" className="size-3 animate-pulse rounded-full bg-accent" />
        در حال آماده‌سازی…
      </div>
    </div>
  );
}
