"use client";

import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

type PeriodNavigatorProps = {
  label: string;
  showNav?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday?: () => void;
};

export function PeriodNavigator({
  label,
  showNav = true,
  onPrev,
  onNext,
  onToday,
}: PeriodNavigatorProps) {
  return (
    <div className="glass flex items-center justify-between gap-2 rounded-2xl p-3">
      {showNav ? (
        <button
          type="button"
          className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface"
          onClick={onPrev}
        >
          <ArrowRight2 size={18} />
        </button>
      ) : (
        <div className="size-10" />
      )}
      <div className="min-w-0 text-center">
        <p className="truncate text-sm font-semibold">{label}</p>
        {showNav && onToday && (
          <button
            type="button"
            className="mt-1 cursor-pointer text-xs text-accent"
            onClick={onToday}
          >
            برو به امروز
          </button>
        )}
      </div>
      {showNav ? (
        <button
          type="button"
          className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface"
          onClick={onNext}
        >
          <ArrowLeft2 size={18} />
        </button>
      ) : (
        <div className="size-10" />
      )}
    </div>
  );
}
