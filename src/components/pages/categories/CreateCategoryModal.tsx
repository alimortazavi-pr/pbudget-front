"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Modal, Switch } from "@heroui/react";

import { DEFAULT_CATEGORY_COLORS } from "@/common/constants/category-colors";
import * as categoriesApi from "@/common/api/categories";
import type { ICategory } from "@/common/interfaces/category.interface";
import { getParentSelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormPriceInput, FormSelect } from "@/components/common/form/FormFields";
import { CategoryColorPicker } from "@/components/common/form/CategoryColorPicker";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";
import { CategoryKind } from "@/types/enums";
import { userSelector } from "@/stores/profile";
import { currencyLabel } from "@/common/constants/user-preferences";

type CreateCategoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (category: ICategory) => void;
};

export function CreateCategoryModal({
  open,
  onOpenChange,
  onCreated,
}: CreateCategoryModalProps) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState("");
  const [isProjectKind, setIsProjectKind] = useState(false);
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLORS[0]);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const parentOptions = useMemo(
    () => getParentSelectOptions(categories ?? []),
    [categories],
  );

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      showToast("عنوان دسته‌بندی الزامی است");
      return;
    }

    setSaving(true);
    try {
      const created = await categoriesApi.createCategory({
        title: title.trim(),
        parentId: parentId || null,
        kind: isProjectKind ? CategoryKind.PROJECT : CategoryKind.DEFAULT,
        color,
        monthlyLimit: monthlyLimit.trim() || "0",
      });
      dispatch(setCategories([...(categories ?? []), created]));
      showToast("دسته‌بندی ایجاد شد", "success");
      onCreated?.(created);
      setTitle("");
      setParentId("");
      setIsProjectKind(false);
      setColor(DEFAULT_CATEGORY_COLORS[0]);
      setMonthlyLimit("");
      onOpenChange(false);
    } catch (err) {
      showErrorToast(err, "ایجاد دسته‌بندی ناموفق بود");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <form onSubmit={(e) => void save(e)}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>ایجاد دسته‌بندی</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <FormInput
              label="عنوان"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <FormSelect
              label="دسته والد"
              placeholder="بدون والد"
              selectedKey={parentId || "none"}
              onSelectionChange={(key) => setParentId(key === "none" ? "" : key)}
              options={parentOptions}
            />
            <CategoryColorPicker value={color} onChange={setColor} />
            <FormPriceInput
              label={`سقف ماهانه (${currencyLabel(preferredCurrency)})`}
              value={monthlyLimit}
              onChange={setMonthlyLimit}
              placeholder="۰ = بدون محدودیت"
            />
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-secondary px-3 py-3">
              <div>
                <p className="text-sm font-medium">نوع پروژه</p>
                <p className="text-xs text-muted">برای مدیریت قرارداد و پرداخت‌های خرد</p>
              </div>
              <Switch isSelected={isProjectKind} onChange={setIsProjectKind} size="sm">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              variant="ghost"
              onPress={() => onOpenChange(false)}
            >
              بستن
            </Button>
            <Button type="submit" isPending={saving}>
              ایجاد
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
