"use client";

import { Button, Checkbox } from "@heroui/react";
import { Edit2 } from "iconsax-reactjs";

import type { ICategory } from "@/common/interfaces/category.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatJalaliDate, formatPrice } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { FormCategoryComboBox } from "@/components/common/form/FormFields";
import { BudgetType } from "@/types/enums";
import type { ImportRowDraft } from "./import-row.types";
import { buildImportRowSummary, isImportRowConfigured } from "./import-row.util";

type BankImportRowCardProps = {
  row: ImportRowDraft;
  categories: ICategory[];
  paymentCards: IPaymentCard[];
  onToggle: () => void;
  onCategoryChange: (categoryId: string) => void;
  onEdit: () => void;
};

export function BankImportRowCard({
  row,
  categories,
  paymentCards,
  onToggle,
  onCategoryChange,
  onEdit,
}: BankImportRowCardProps) {
  const categoryOptions = getCategorySelectOptions(categories);
  const configured = isImportRowConfigured(row);
  const extraSummary = buildImportRowSummary(row, categories, paymentCards).filter(
    (item) => item !== categories.find((c) => c._id === row.categoryId)?.title,
  );

  return (
    <article
      className={`rounded-2xl border p-4 transition-opacity ${
        row.isDuplicate
          ? "border-border/40 bg-surface-secondary/30 opacity-50"
          : row.selected
            ? configured
              ? "border-border/60 bg-surface/80"
              : "border-warning/40 bg-warning/5"
            : "border-border/40 bg-surface-secondary/20 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          variant="secondary"
          isSelected={row.selected}
          isDisabled={row.isDuplicate}
          aria-label={row.selected ? "حذف از انتخاب" : "افزودن به انتخاب"}
          className="mt-1 shrink-0"
          onChange={onToggle}
        >
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">{row.transactionKind}</p>
              <p className="mt-1 text-xs text-muted">
                {formatJalaliDate(row.year, row.month, row.day)}
              </p>
              <p className="mt-2 line-clamp-2 text-xs text-muted">{row.description}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <p
                className={`font-bold ${
                  Number(row.type) === BudgetType.INCOME ? "text-income" : "text-expense"
                }`}
              >
                {Number(row.type) === BudgetType.INCOME ? "+" : "-"}
                {formatPrice(Number(row.price))}
              </p>
              {!row.isDuplicate ? (
                <Button size="sm" variant="ghost" onPress={onEdit}>
                  <Edit2 size={16} />
                  بیشتر
                </Button>
              ) : null}
            </div>
          </div>

          {row.isDuplicate ? (
            <span className="inline-flex rounded-md bg-muted/20 px-2 py-0.5 text-[10px] font-semibold text-muted">
              قبلاً ثبت شده
            </span>
          ) : (
            <>
              <div
                className={!row.selected ? "pointer-events-none" : undefined}
                onClick={(e) => e.stopPropagation()}
              >
                <FormCategoryComboBox
                  label="دسته‌بندی *"
                  placeholder="انتخاب دسته‌بندی"
                  selectedKey={row.categoryId || undefined}
                  isDisabled={!row.selected}
                  onSelectionChange={(key) => {
                    onCategoryChange(key === "all" ? "" : key);
                  }}
                  options={categoryOptions}
                  emptyMessage="دسته‌ای ثبت نشده"
                />
              </div>

              {row.selected && extraSummary.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {extraSummary.map((item) => (
                    <span
                      key={item}
                      className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
