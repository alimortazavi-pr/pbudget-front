"use client";

import Link from "next/link";

import { PATHS } from "@/common/constants";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatJalaliDate, formatPrice } from "@/common/utils";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { BudgetType } from "@/types/enums";

type PartnerBudgetCardProps = {
  budget: IBudget;
  currentUserId?: string | null;
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
            {formatJalaliDate(budget.year, budget.month, budget.day)}
          </p>
          {attribution ? (
            <p className="mt-2 text-xs leading-6 text-muted">{attribution}</p>
          ) : null}
        </div>
        <p
          className={`shrink-0 font-bold ${isIncome ? "text-income" : "text-expense"}`}
        >
          {isIncome ? "+" : "-"}
          {formatPrice(budget.price)}
        </p>
      </div>
    </Link>
  );
}
