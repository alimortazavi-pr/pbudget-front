"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useMemo, useState } from "react";
import { DocumentFilter } from "iconsax-reactjs";

import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { FormCategoryComboBox } from "@/components/common/form/FormFields";
import { MoreFilterModal } from "@/components/pages/dashboard/MoreFilterModal";
import type { ICategory } from "@/common/interfaces/category.interface";

type DashboardFilterSectionProps = {
  categories: ICategory[];
  category: string;
  year: string;
  month: string;
  day: string;
  compact?: boolean;
  onCategoryChange: (category: string) => void;
  onApplyFilter: (patch: {
    category: string;
    year: string;
    month: string;
    day: string;
  }) => void;
};

export function DashboardFilterSection({
  categories,
  category,
  year,
  month,
  day,
  compact = false,
  onCategoryChange,
  onApplyFilter,
}: DashboardFilterSectionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const categoryOptions = useMemo(
    () => getCategorySelectOptions(categories),
    [categories],
  );

  return (
    <>
      <div className="glass flex items-end gap-2 rounded-2xl p-3 lg:gap-4 lg:p-5">
        <div className="min-w-0 flex-1">
          <FormCategoryComboBox
            label={t("dashboard.filterByCategory")}
            placeholder={t("dashboard.allCategories")}
            selectedKey={category || "all"}
            onSelectionChange={(key) =>
              onCategoryChange(key === "all" ? "" : key)
            }
            allowCreate={false}
            options={[
              { id: "all", label: t("dashboard.allCategories") },
              ...categoryOptions,
            ]}
            emptyMessage={t("dashboard.noCategoryCreatedYet")}
          />
        </div>
        {!compact ? (
          <button
            type="button"
            className="mb-0.5 flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-surface-secondary px-3 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
            onClick={() => setOpen(true)}
          >
            <span>{t("common.filter")}</span>
            <DocumentFilter size={18} />
          </button>
        ) : null}
      </div>

      {!compact ? (
        <MoreFilterModal
          open={open}
          onOpenChange={setOpen}
          categories={categories}
          initialCategory={category}
          initialYear={year}
          initialMonth={month}
          initialDay={day}
          onApply={onApplyFilter}
        />
      ) : null}
    </>
  );
}
