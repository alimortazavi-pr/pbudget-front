"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@heroui/react";
import { Edit2, MoneyAdd, MoneyRemove, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as budgetsApi from "@/common/api/budgets";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatBudgetDateTime } from "@/common/utils/calendar-date";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { mergeProfileWallet } from "@/common/utils/wallet-balances";
import {
  resolveBudgetCurrency,
  resolveBudgetDateCalendar,
} from "@/common/constants/user-preferences";
import { showToast } from "@/common/utils/toast";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision, deleteBudget } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";
import { BudgetType } from "@/types/enums";

type SimpleTransactionCardProps = {
  budget: IBudget;
};

export function SimpleTransactionCard({ budget }: SimpleTransactionCardProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isIncome = budget.type === BudgetType.INCOME;
  const budgetCurrency = resolveBudgetCurrency(budget.currency);
  const budgetCalendar = resolveBudgetDateCalendar(budget.dateCalendar);
  const categoryTitle =
    budget.pendingCategory
      ? t("dashboard.needsCategory")
      : budget.category?.title ?? t("common.noCategory");

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await budgetsApi.softDeleteBudget(budget._id);
      dispatch(deleteBudget(budget));
      if (user) {
        dispatch(setProfile(mergeProfileWallet(user, res)));
      }
      dispatch(bumpBudgetRevision());
      showToast(t("common.deleted"), "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t("dashboard.deleteTransactionError"),
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li
      className="pb-simple-transaction"
      data-type={isIncome ? "income" : "expense"}
    >
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 text-start"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 shrink-0 text-foreground/80">
            {isIncome ? (
              <MoneyAdd size={22} variant="Bold" />
            ) : (
              <MoneyRemove size={22} variant="Bold" />
            )}
          </span>
          <div className="min-w-0">
            <p
              className={`truncate text-base font-bold leading-tight ${
                isIncome ? "text-income" : "text-expense"
              }`}
            >
              {categoryTitle}
            </p>
            {budget.description ? (
              <p className="mt-0.5 truncate text-xs text-muted">
                {budget.description}
              </p>
            ) : null}
          </div>
        </div>
        <p className="shrink-0 text-base font-bold text-foreground tabular-nums">
          {formatPriceWithCurrency(budget.price, budgetCurrency)}
        </p>
      </button>

      {expanded ? (
        <div
          className="mt-3 border-t border-border/50 pt-3"
          onClick={(event) => event.stopPropagation()}
        >
          <p className="mb-3 text-xs text-muted">
            {formatBudgetDateTime(
              budget.year,
              budget.month,
              budget.day,
              budget.createdAt,
              budgetCalendar,
            )}
          </p>
          <div className="flex gap-2">
            <Link href={PATHS.BUDGET(budget._id)} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full">
                <Edit2 size={16} />
                {t("common.edit")}
              </Button>
            </Link>
            <Button
              size="sm"
              variant="danger"
              className="flex-1"
              isPending={deleting}
              onPress={() => void handleDelete()}
            >
              <Trash size={16} />
              {t("common.delete")}
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
