type SettlementProgressBarProps = {
  progress: number;
  tone: "receivable" | "payable";
  label?: string;
};

export function SettlementProgressBar({
  progress,
  tone,
  label = "پیشرفت تسویه",
}: SettlementProgressBarProps) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  const fillColor =
    tone === "receivable" ? "var(--brand-teal-deep)" : "var(--brand-rose-deep)";

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{Math.round(clamped)}٪</span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-surface-secondary"
        dir="ltr"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  );
}
