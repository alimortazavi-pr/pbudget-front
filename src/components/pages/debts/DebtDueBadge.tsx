"use client";

import { Calendar } from "iconsax-reactjs";

import type { IDebt } from "@/common/interfaces/debt.interface";
import { daysUntilDue, dueTone } from "@/common/utils/debt-due";
import { useTranslation } from "@/components/providers/LanguageProvider";

const TONE_CLASS = {
  overdue: "bg-danger/12 text-danger",
  today: "bg-warning/20 text-warning-foreground",
  soon: "bg-warning/12 text-warning-foreground",
  later: "bg-surface-secondary text-muted",
} as const;

/** Due-date chip for open debts: overdue, today, or days left. */
export function DebtDueBadge({ debt }: { debt: IDebt }) {
  const { t } = useTranslation();
  if (debt.status === "settled") return null;
  const days = daysUntilDue(debt);
  if (days === null) return null;
  const tone = dueTone(days);
  const label =
    tone === "overdue"
      ? t("debts.overdueBy", { days: Math.abs(days) })
      : tone === "today"
        ? t("debts.dueToday")
        : t("debts.dueIn", { days });
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${TONE_CLASS[tone]}`}>
      <Calendar size={13} />
      {label}
    </span>
  );
}
