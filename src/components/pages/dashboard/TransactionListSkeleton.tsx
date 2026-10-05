export function TransactionListSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border/40 bg-surface p-4">
          <div className="pb-shimmer size-11 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <div className="pb-shimmer h-3.5 w-2/5 rounded-full" />
            <div className="pb-shimmer h-3 w-1/4 rounded-full" />
          </div>
          <div className="pb-shimmer h-4 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
