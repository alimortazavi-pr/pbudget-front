"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";

import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FormCategoryComboBox } from "@/components/common/form/FormFields";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";
import type { ICategory } from "@/common/interfaces/category.interface";

type MoreFilterModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ICategory[];
  initialCategory: string;
  initialYear: string;
  initialMonth: string;
  initialDay: string;
  onApply: (patch: {
    category: string;
    year: string;
    month: string;
    day: string;
  }) => void;
};

export function MoreFilterModal({
  open,
  onOpenChange,
  categories,
  initialCategory,
  initialYear,
  initialMonth,
  initialDay,
  onApply,
}: MoreFilterModalProps) {
  const { t } = useTranslation();
  const [category, setCategory] = useState(initialCategory);
  const [date, setDate] = useState({
    year: initialYear,
    month: initialMonth,
    day: initialDay,
  });
  const categoryOptions = useMemo(
    () => getCategorySelectOptions(categories),
    [categories],
  );

  useEffect(() => {
    if (!open) return;
    setCategory(initialCategory);
    setDate({
      year: initialYear,
      month: initialMonth,
      day: initialDay,
    });
  }, [open, initialCategory, initialYear, initialMonth, initialDay]);

  function apply() {
    onApply({
      category,
      year: date.year,
      month: date.month,
      day: date.day,
    });
    onOpenChange(false);
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="overflow-visible">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{t("فیلتر تراکنش‌ها")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4 overflow-visible">
          <FormCategoryComboBox
            label={t("دسته‌بندی")}
            placeholder={t("همه دسته‌بندی‌ها")}
            selectedKey={category || "all"}
            onSelectionChange={(key) => setCategory(key === "all" ? "" : key)}
            options={[
              { id: "all", label: "همه دسته‌بندی‌ها" },
              ...categoryOptions,
            ]}
            emptyMessage="دسته‌ای ثبت نشده"
          />
          <FilterDatePicker
            year={date.year}
            month={date.month}
            day={date.day}
            inModal
            onChange={setDate}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
            بستن
          </Button>
          <Button type="button" onPress={apply}>
            فیلتر
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
