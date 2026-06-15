"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal, Switch } from "@heroui/react";
import { Add, Category, Edit2, Trash } from "iconsax-reactjs";

import * as categoriesApi from "@/common/api/categories";
import type { ICategory } from "@/common/interfaces/category.interface";
import {
  buildCategoryTree,
  collectDescendantIdSet,
  flattenCategoryTreeForList,
  getCategoryParentId,
  getParentSelectOptions,
} from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";
import { CategoryKind } from "@/types/enums";

export function CategoriesPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ICategory | null>(null);
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState("");
  const [isProjectKind, setIsProjectKind] = useState(false);
  const [saving, setSaving] = useState(false);

  const categoryRows = useMemo(() => {
    if (!categories?.length) return [];
    return flattenCategoryTreeForList(buildCategoryTree(categories));
  }, [categories]);

  const parentOptions = useMemo(
    () => getParentSelectOptions(categories ?? [], editItem?._id),
    [categories, editItem],
  );

  useEffect(() => {
    void categoriesApi.fetchCategories().then((data) => {
      dispatch(setCategories(data));
    });
  }, [dispatch]);

  function openCreate() {
    setEditItem(null);
    setTitle("");
    setParentId("");
    setIsProjectKind(false);
    setOpen(true);
  }

  function openEdit(cat: ICategory) {
    setEditItem(cat);
    setTitle(cat.title);
    setParentId(getCategoryParentId(cat) ?? "");
    setIsProjectKind(cat.kind === CategoryKind.PROJECT);
    setOpen(true);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        parentId: parentId || null,
        kind: isProjectKind ? CategoryKind.PROJECT : CategoryKind.DEFAULT,
      };

      if (editItem) {
        const updated = await categoriesApi.updateCategory(editItem._id, payload);
        dispatch(
          setCategories(
            (categories ?? []).map((category) =>
              category._id === updated._id ? updated : category,
            ),
          ),
        );
      } else {
        const created = await categoriesApi.createCategory(payload);
        dispatch(setCategories([...(categories ?? []), created]));
      }

      showToast("ذخیره شد", "success");
      setOpen(false);
      setTitle("");
      setParentId("");
      setIsProjectKind(false);
      setEditItem(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function remove(cat: ICategory) {
    try {
      const removeIds = collectDescendantIdSet(categories ?? [], cat._id);
      await categoriesApi.softDeleteCategory(cat._id);
      dispatch(
        setCategories((categories ?? []).filter((category) => !removeIds.has(category._id))),
      );
      showToast("حذف شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">دسته‌بندی‌ها</h2>
          <p className="text-sm text-muted">دسته‌های اصلی و زیردسته‌ها</p>
        </div>
        <Button
          isIconOnly
          className="bg-accent text-accent-foreground"
          onPress={openCreate}
        >
          <Add size={20} />
        </Button>
      </div>

      {!categoryRows.length ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Category size={36} className="mx-auto mb-3 text-muted" />
          <p>دسته‌بندی‌ای وجود ندارد</p>
        </div>
      ) : (
        <div className="pb-card-grid">
          {categoryRows.map(({ category, depth }) => (
            <div
              key={category._id}
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-surface px-4 py-3 lg:ms-0"
              style={depth > 0 ? { marginInlineStart: depth * 16 } : undefined}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{category.title}</span>
                  {category.kind === CategoryKind.PROJECT ? (
                    <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      پروژه
                    </span>
                  ) : null}
                </div>
                {depth > 0 ? (
                  <p className="text-xs text-muted">زیردسته</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  onPress={() => openEdit(category)}
                >
                  <Edit2 size={16} />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="danger"
                  onPress={() => void remove(category)}
                >
                  <Trash size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppModal open={open} onOpenChange={setOpen}>
        <AppModalDialog>
          <form onSubmit={(e) => void save(e)}>
            <AppModalHeader onClose={() => setOpen(false)}>
              <Modal.Heading>
                {editItem ? "ویرایش دسته" : "دسته جدید"}
              </Modal.Heading>
            </AppModalHeader>
            <Modal.Body className="space-y-4">
              <FormInput
                label="عنوان"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              <Button type="button" variant="ghost" onPress={() => setOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" isPending={saving}>
                ذخیره
              </Button>
            </Modal.Footer>
          </form>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
