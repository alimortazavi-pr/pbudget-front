"use client";

import Link from "next/link";

import { PATHS } from "@/common/constants";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatPrice } from "@/common/utils";
import { formatBudgetDate } from "@/common/utils/calendar-date";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { resolveBudgetCurrency, resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import { Link1 } from "iconsax-reactjs";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { BudgetType } from "@/types/enums";

type PartnerBudgetCardProps = {
  budget: IBudget;
  currentUserId?: string | null;
  /** Show an "unlink" action (e.g. remove from a project). */
  onDetach?: () => void;
  detachLabel?: string;
};

function usePerformerLabel(
  budget: IBudget,
  currentUserId?: string | null,
): string | null {
  const { t } = useTranslation();
  const performer = budget.performer;
  if (!performer) return null;

  const isMe = Boolean(currentUserId && performer.userId === currentUserId);
  const name = isMe
    ? `${performer.displayName} ${t("common.youSuffix")}`
    : performer.displayName;

  if (performer.sharePercent > 0) {
    return t("common.registeredByShare", {
      name,
      percent: performer.sharePercent,
      amount: formatPrice(performer.shareAmount),
    });
  }

  return t("common.registeredBy", { name });
}

export function PartnerBudgetCard({
  budget,
  currentUserId,
  onDetach,
  detachLabel,
}: PartnerBudgetCardProps) {
  const { t } = useTranslation();
  const isIncome = budget.type === BudgetType.INCOME;
  const attribution = usePerformerLabel(budget, currentUserId);

  return (
    <Link
      href={PATHS.BUDGET(budget._id)}
      className="block glass rounded-2xl p-4 transition hover:border-accent/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {isIncome ? t("common.incomeShort") : t("common.paymentShort")}
            {budget.description ? ` · ${budget.description}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted">
            {formatBudgetDate(budget.year, budget.month, budget.day, resolveBudgetDateCalendar(budget.dateCalendar))}
          </p>
          {attribution ? (
            <p className="mt-2 text-xs leading-6 text-muted">{attribution}</p>
          ) : null}
        </div>
        <p
          className={`shrink-0 font-bold ${isIncome ? "text-income" : "text-expense"}`}
        >
          {isIncome ? "+" : "-"}
          {formatPriceWithCurrency(budget.price, resolveBudgetCurrency(budget.currency))}
        </p>
      </div>
      {onDetach ? (
        <div className="mt-3 flex justify-end border-t border-border/50 pt-2">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-surface-secondary hover:text-danger"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDetach();
            }}
          >
            <Link1 size={14} className="rotate-45" />
            {detachLabel}
          </button>
        </div>
      ) : null}
    </Link>
  );
}
