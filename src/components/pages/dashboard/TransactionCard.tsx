"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Edit2, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as budgetsApi from "@/common/api/budgets";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { resolveCategoryColor } from "@/common/constants/category-colors";
import { categoryAccentStyle } from "@/common/utils/category-accent";
import { paymentCardSubtitle } from "@/common/utils/payment-card";
import { formatBudgetDateTime, formatJalaliDate, formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision, deleteBudget } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";
import { BudgetType, DebtType } from "@/types/enums";

type TransactionCardProps = {
  budget: IBudget;
};

function resolvePaymentCardLabel(
  paymentCard?: IBudget["paymentCard"],
): string | null {
  if (!paymentCard || typeof paymentCard === "string") return null;
  const card = paymentCard as IPaymentCard;
  const number = paymentCardSubtitle("", card.lastFour, true);
  return [card.title, number].filter(Boolean).join(" · ");
}

export function TransactionCard({ budget }: TransactionCardProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isIncome = budget.type === BudgetType.INCOME;
  const debt = budget.debt;
  const isPendingCategory = Boolean(budget.pendingCategory);
  const categoryColor = isPendingCategory
    ? "#f59e0b"
    : resolveCategoryColor(budget.category?.color);
  const categoryStyle = isPendingCategory
    ? { borderInlineStartColor: "#f59e0b", borderInlineStartWidth: "3px" }
    : categoryAccentStyle(budget.category?.color);
  const paymentCardLabel = resolvePaymentCardLabel(budget.paymentCard);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await budgetsApi.softDeleteBudget(budget._id);
      dispatch(deleteBudget(budget));
      if (user && res.userBudget !== undefined) {
        dispatch(setProfile({ ...user, budget: res.userBudget }));
      }
      dispatch(bumpBudgetRevision());
      showToast("تراکنش حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در حذف");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article
      className={`pb-transaction-row cursor-pointer ${
        isPendingCategory ? "border border-warning/30 bg-warning/5" : ""
      }`}
      style={categoryStyle}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: categoryColor }}
              aria-hidden
            />
            <p className="truncate font-medium">
              {isPendingCategory ? "نیاز به دسته‌بندی" : budget.category?.title}
            </p>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {formatJalaliDate(budget.year, budget.month, budget.day)}
            {paymentCardLabel ? ` · ${paymentCardLabel}` : ""}
            {isPendingCategory && typeof budget.sourceBank === "object" && budget.sourceBank?.title
              ? ` · ${budget.sourceBank.title}`
              : ""}
          </p>
          {isPendingCategory && (
            <span className="mt-1 inline-flex rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">
              ایمپورت بانکی
            </span>
          )}
          {debt && (
            <span
              className={`mt-1 inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                debt.type === DebtType.RECEIVABLE
                  ? "bg-income-soft text-income"
                  : "bg-expense-soft text-expense"
              }`}
            >
              {debt.type === DebtType.RECEIVABLE ? "طلب" : "بدهی"} · {debt.person}
              {debt.status !== "settled" ? ` · ${formatPrice(debt.remainingAmount)}` : ""}
            </span>
          )}
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
