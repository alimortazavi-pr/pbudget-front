"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Modal, Switch } from "@heroui/react";

import * as categoriesApi from "@/common/api/categories";
import type { ICategory } from "@/common/interfaces/category.interface";
import { getParentSelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect } from "@/components/common/form/FormFields";
import { AppModal } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";
import { CategoryKind } from "@/types/enums";

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
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState("");
  const [isProjectKind, setIsProjectKind] = useState(false);
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
      });
      dispatch(setCategories([...(categories ?? []), created]));
      showToast("دسته‌بندی ایجاد شد", "success");
      onCreated?.(created);
      setTitle("");
      setParentId("");
      setIsProjectKind(false);
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog>
        <form onSubmit={(e) => void save(e)}>
          <Modal.Header>
            <Modal.Heading>ایجاد دسته‌بندی</Modal.Heading>
          </Modal.Header>
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
      </Modal.Dialog>
    </AppModal>
  );
}
