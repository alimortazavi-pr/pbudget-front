"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Button, Checkbox } from "@heroui/react";
import { Edit2 } from "iconsax-reactjs";

import type { ICategory } from "@/common/interfaces/category.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatJalaliDateWithTime, formatPrice, toPersianDigits } from "@/common/utils";
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
  const { t } = useTranslation();
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
          aria-label={row.selected ? t("auto.k1dfcfadd65") : t("auto.k1b63a4912d")}
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
                {formatJalaliDateWithTime(
                  row.year,
                  row.month,
                  row.day,
                  row.hour,
                  row.minute,
                )}
              </p>
              {(row.documentNumber || row.rowNumber > 0) && (
                <p className="mt-1 text-[10px] text-muted/80">
                  {row.documentNumber ? (
                    <>
                      {t("auto.k1ac3c3a359")}{toPersianDigits(row.documentNumber)}
                      {row.rowNumber > 0 ? " · " : ""}
                    </>
                  ) : null}
                  {row.rowNumber > 0 ? (
                    <>{t("auto.kf0c26bb7c0")}{toPersianDigits(row.rowNumber)}</>
                  ) : null}
                </p>
              )}
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
                  {t("nav.more")}
                </Button>
              ) : null}
            </div>
          </div>

          {row.isDuplicate ? (
            <span className="inline-flex rounded-md bg-muted/20 px-2 py-0.5 text-[10px] font-semibold text-muted">
              {t("auto.k33248b8685")}
            </span>
          ) : (
            <>
              <div
                className={!row.selected ? "pointer-events-none" : undefined}
                onClick={(e) => e.stopPropagation()}
              >
                <FormCategoryComboBox
                  label={t("auto.k9f1d861765")}
                  placeholder={t("auto.k34ca0cc3ac")}
                  selectedKey={row.categoryId || undefined}
                  isDisabled={!row.selected}
                  onSelectionChange={(key) => {
                    onCategoryChange(key === "all" ? "" : key);
                  }}
                  options={categoryOptions}
                  emptyMessage={t("auto.kf4be303fa3")}
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
