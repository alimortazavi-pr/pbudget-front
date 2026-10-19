"use client";

import { useTranslation } from "@/i18n";

import { useState } from "react";
import { Button } from "@heroui/react";
import { LinkButton } from "@/components/common/ui/LinkButton";
import { ArrowDown, ArrowUp, Edit2, Flash, TickCircle, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as budgetsApi from "@/common/api/budgets";
import * as templatesApi from "@/common/api/transaction-templates";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { resolveCategoryColor } from "@/common/constants/category-colors";
import { paymentCardSubtitle } from "@/common/utils/payment-card";
import { formatBudgetDate } from "@/common/utils/calendar-date";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { mergeProfileWallet } from "@/common/utils/wallet-balances";
import {
  resolveBudgetCurrency,
  resolveBudgetDateCalendar,
} from "@/common/constants/user-preferences";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { SaveTemplateModal } from "@/components/pages/budget/SaveTemplateModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision, deleteBudget } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";
import { BudgetType, DebtType } from "@/types/enums";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { TransactionDetails } from "./TransactionDetails";

type TransactionCardProps = {
  budget: IBudget;
  /** Bulk selection: tapping the card toggles it instead of expanding. */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Position counted from the oldest transaction (1), shown before the icon. */
  rowNumber?: number;
};

function resolvePaymentCardLabel(
  paymentCard?: IBudget["paymentCard"]
): string | null {
  if (!paymentCard || typeof paymentCard === "string") return null;
  const card = paymentCard as IPaymentCard;
  const number = paymentCardSubtitle("", card.lastFour, true);
  return [card.title, number].filter(Boolean).join(" · ");
}

export function TransactionCard({ budget, selectMode = false, selected = false, onToggleSelect, rowNumber }: TransactionCardProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const isIncome = budget.type === BudgetType.INCOME;
  const debt = budget.debt;
  const isPendingCategory = Boolean(budget.pendingCategory);
  const categoryColor = isPendingCategory
    ? "#f59e0b"
    : resolveCategoryColor(budget.category?.color, budget.category?._id);
  const categoryTitle = isPendingCategory ? t("dashboard.needsCategory") : budget.category?.title ?? "";
  const paymentCardLabel = resolvePaymentCardLabel(budget.paymentCard);
  const budgetCurrency = resolveBudgetCurrency(budget.currency);
  const budgetCalendar = resolveBudgetDateCalendar(budget.dateCalendar);

  async function handleDelete(mode: budgetsApi.DeleteMode) {
    setDeleting(true);
    try {
      const res =
        mode === "trash"
          ? await budgetsApi.moveBudgetToTrash(budget._id)
          : await budgetsApi.hardDeleteBudget(budget._id);
      dispatch(deleteBudget(budget));
      if (user) {
        dispatch(setProfile(mergeProfileWallet(user, res)));
      }
      dispatch(bumpBudgetRevision());
      setDeleteOpen(false);
      showToast(mode === "trash" ? "به سطل زباله منتقل شد" : t("common.deleted"), "success");
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : t("dashboard.deleteTransactionError")
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <article
        className={`pb-tx group ${isPendingCategory ? "pb-tx-pending" : ""}`}
        style={{ ["--cat" as string]: categoryColor }}
        data-expanded={expanded && !selectMode ? "true" : "false"}
        data-selected={selectMode && selected ? "true" : undefined}
        role={selectMode ? "checkbox" : undefined}
        aria-checked={selectMode ? selected : undefined}
        tabIndex={selectMode ? 0 : undefined}
        onKeyDown={(event) => {
          if (selectMode && (event.key === " " || event.key === "Enter")) {
            event.preventDefault();
            onToggleSelect?.();
          }
        }}
        onClick={() => (selectMode ? onToggleSelect?.() : setExpanded((v) => !v))}
      >
        <div className="flex items-center gap-3">
          {selectMode ? (
            <span
              aria-hidden
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                selected ? "border-accent bg-accent text-accent-foreground" : "border-border"
              }`}
            >
              {selected ? <TickCircle size={16} variant="Bold" /> : null}
            </span>
          ) : null}
          {rowNumber ? (
            <span className="min-w-5 shrink-0 text-center text-[11px] font-medium tabular-nums text-muted" title="ردیف">
              {toPersianDigits(rowNumber)}
            </span>
          ) : null}
          <span className="pb-tx-icon" aria-hidden>
            {isPendingCategory ? "؟" : (categoryTitle.trim().charAt(0) || (isIncome ? "+" : "−"))}
            <span className={`pb-tx-dir ${isIncome ? "bg-[var(--brand-teal)]" : "bg-[var(--brand-rose)]"}`}>
              {isIncome ? <ArrowDown size={9} /> : <ArrowUp size={9} />}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold lg:text-[0.95rem]">
              {budget.description?.trim() || categoryTitle}
            </p>
            <p className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-muted">
              {budget.description?.trim() ? (
                <span className="inline-flex shrink-0 items-center gap-1 font-medium" style={{ color: categoryColor }}>
                  <span className="size-1.5 rounded-full" style={{ background: categoryColor }} />
                  {categoryTitle}
                </span>
              ) : null}
              <span className="truncate">
                {formatBudgetDate(budget.year, budget.month, budget.day, budgetCalendar)}
                {paymentCardLabel ? ` · ${paymentCardLabel}` : ""}
                {isPendingCategory && typeof budget.sourceBank === "object" && budget.sourceBank?.title
                  ? ` · ${budget.sourceBank.title}`
                  : ""}
              </span>
            </p>
            {isPendingCategory || debt ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {isPendingCategory ? (
                  <span className="inline-flex rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">
                    {t("dashboard.bankImportBadge")}
                  </span>
                ) : null}
                {debt ? (
                  <span
                    className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                      debt.type === DebtType.RECEIVABLE ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
                    }`}
                  >
                    {debt.type === DebtType.RECEIVABLE ? t("dashboard.receivableLabel") : t("dashboard.debtLabel")} ·{" "}
                    {debt.person}
                    {debt.status !== "settled"
                      ? ` · ${formatPriceWithCurrency(debt.remainingAmount, budgetCurrency)}`
                      : ""}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
          <p
            className={`shrink-0 text-sm font-bold tabular-nums lg:text-base ${isIncome ? "text-income" : "text-expense"}`}
          >
            {isIncome ? "+" : "−"}
            {formatPriceWithCurrency(budget.price, budgetCurrency)}
          </p>
        </div>

        {expanded && !selectMode && (
          <div
            className="pb-rise-in mt-3 border-t border-border/50 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <TransactionDetails
              budget={budget}
              currency={budgetCurrency}
              calendar={budgetCalendar}
              categoryTitle={isPendingCategory ? "" : categoryTitle}
              paymentCardLabel={paymentCardLabel}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <LinkButton
                href={PATHS.BUDGET(budget._id)}
                size="sm"
                variant="secondary"
                className="flex-1"
              >
                <Edit2 size={16} />
                {t("common.edit")}
              </LinkButton>
              <Button
                size="sm"
                variant="danger"
                className="flex-1"
                isPending={deleting}
                onPress={() => setDeleteOpen(true)}
              >
                <Trash size={16} />
                {t("common.delete")}
              </Button>
              <Button size="sm" variant="ghost" className="w-full" onPress={() => setTemplateOpen(true)}>
                <Flash size={16} />
                {t("feat.templates.saveAction")}
              </Button>
            </div>
          </div>
        )}
      </article>
      <SaveTemplateModal
        open={templateOpen}
        onOpenChange={setTemplateOpen}
        defaultTitle={budget.description?.trim().slice(0, 40) || budget.category?.title || ""}
        onSave={async (title) => {
          try {
            const card = typeof budget.paymentCard === "string" ? budget.paymentCard : budget.paymentCard?._id;
            const project = typeof budget.project === "string" ? budget.project : budget.project?._id;
            await templatesApi.createTemplate({
              title,
              type: budget.type === BudgetType.INCOME ? "0" : "1",
              price: String(budget.price),
              categoryId: budget.category?._id,
              paymentCardId: card || undefined,
              projectId: project || undefined,
              description: budget.description?.trim() || undefined,
            });
            showToast(t("feat.templates.saved"), "success");
          } catch (error) {
            showErrorToast(error);
            throw error;
          }
        }}
      />
      <DeleteTransactionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={(mode) => void handleDelete(mode)}
        isPending={deleting}
        price={budget.price}
        type={budget.type}
        currency={budgetCurrency}
      />
    </>
  );
}
