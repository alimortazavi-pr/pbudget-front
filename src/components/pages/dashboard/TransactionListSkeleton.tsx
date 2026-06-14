export function TransactionListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="pb-shimmer h-20 w-full" />
      ))}
    </div>
  );
}
