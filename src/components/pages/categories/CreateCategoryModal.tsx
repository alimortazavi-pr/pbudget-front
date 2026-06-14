"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as categoriesApi from "@/common/api/categories";
import type { ICategory } from "@/common/interfaces/category.interface";
import { getParentSelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect } from "@/components/common/form/FormFields";
import { AppModal } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";

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
      });
      dispatch(setCategories([...(categories ?? []), created]));
      showToast("دسته‌بندی ایجاد شد", "success");
      onCreated?.(created);
      setTitle("");
      setParentId("");
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
