"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Edit2, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as budgetsApi from "@/common/api/budgets";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatBudgetDateTime, formatJalaliDate, formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { deleteBudget } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";
import { BudgetType } from "@/types/enums";

type TransactionCardProps = {
  budget: IBudget;
};

export function TransactionCard({ budget }: TransactionCardProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isIncome = budget.type === BudgetType.INCOME;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await budgetsApi.softDeleteBudget(budget._id);
      dispatch(deleteBudget(budget));
      if (user && res.userBudget !== undefined) {
        dispatch(setProfile({ ...user, budget: res.userBudget }));
      }
      showToast("تراکنش حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در حذف");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      className="pb-transaction-row cursor-pointer"
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{budget.category?.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            {formatJalaliDate(budget.year, budget.month, budget.day)}
          </p>
        </div>
        <p
          className={`shrink-0 text-base font-bold ${
            isIncome ? "text-income" : "text-expense"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatPrice(budget.price)}
        </p>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-border/50 pt-4" onClick={(e) => e.stopPropagation()}>
          <p className="mb-3 text-sm text-muted">
            {formatBudgetDateTime(
              budget.year,
              budget.month,
              budget.day,
              budget.createdAt,
            )}
          </p>
          {budget.description ? (
            <p className="mb-3 text-sm text-muted">{budget.description}</p>
          ) : null}
          <div className="flex gap-2">
            <Link href={PATHS.BUDGET(budget._id)} className="flex-1">
              <Button size="sm" variant="secondary" className="w-full">
                <Edit2 size={16} />
                ویرایش
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
              حذف
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
