"use client";

import Link from "next/link";

import { PATHS } from "@/common/constants";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatJalaliDate, formatPrice } from "@/common/utils";
import { BudgetType } from "@/types/enums";

type PartnerBudgetCardProps = {
  budget: IBudget;
  currentUserId?: string | null;
};

function performerLabel(
  budget: IBudget,
  currentUserId?: string | null,
): string | null {
  const performer = budget.performer;
  if (!performer) return null;

  const isMe = Boolean(currentUserId && performer.userId === currentUserId);
  const name = isMe ? `${performer.displayName} (شما)` : performer.displayName;

  if (performer.sharePercent > 0) {
    return `ثبت توسط ${name} · سهم ${performer.sharePercent}٪ (${formatPrice(performer.shareAmount)})`;
  }

  return `ثبت توسط ${name}`;
}

export function PartnerBudgetCard({
  budget,
  currentUserId,
}: PartnerBudgetCardProps) {
  const isIncome = budget.type === BudgetType.INCOME;
  const attribution = performerLabel(budget, currentUserId);

  return (
    <Link
      href={PATHS.BUDGET(budget._id)}
      className="block glass rounded-2xl p-4 transition hover:border-accent/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {isIncome ? "دریافت" : "پرداخت"}
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
