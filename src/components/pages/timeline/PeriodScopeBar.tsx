"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Button } from "@heroui/react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

import { PERIOD_DURATIONS } from "@/common/constants/experience";
import { usePeriod } from "@/components/providers/PeriodProvider";

type PeriodScopeBarProps = {
  compact?: boolean;
};

export function PeriodScopeBar({ compact = false }: PeriodScopeBarProps) {
  const { t } = useTranslation();
  const {
    duration,
    periodLabel,
    updatePeriod,
    shiftDay,
    shiftMonth,
    shiftYear,
    goToToday,
  } = usePeriod();

  function shiftPrev() {
    if (duration === "all") return;
    if (duration === "yearly") shiftYear(-1);
    else if (duration === "daily") shiftDay(-1);
    else shiftMonth(-1);
  }

  function shiftNext() {
    if (duration === "all") return;
    if (duration === "yearly") shiftYear(1);
    else if (duration === "daily") shiftDay(1);
    else shiftMonth(1);
  }

  return (
    <div
      className={`pb-period-bar ${compact ? "pb-period-bar-compact" : ""}`}
    >
      <div className="pb-period-scope-toggle">
        {PERIOD_DURATIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="pb-period-scope-btn"
            data-active={duration === item.id ? "true" : "false"}
            onClick={() => updatePeriod({ duration: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>

      {duration !== "all" && (
        <div className="pb-period-nav">
          <Button isIconOnly variant="ghost" size="sm" onPress={shiftPrev}>
            <ArrowRight2 size={18} />
          </Button>
          <button
            type="button"
            className="pb-period-label"
            onClick={goToToday}
            title={t("برو به امروز")}
          >
            {periodLabel}
          </button>
          <Button isIconOnly variant="ghost" size="sm" onPress={shiftNext}>
            <ArrowLeft2 size={18} />
          </Button>
        </div>
      )}
    </div>
  );
}
