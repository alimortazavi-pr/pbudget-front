"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal, Switch } from "@heroui/react";
import { Add, Category, Edit2, Trash } from "iconsax-reactjs";

import * as categoriesApi from "@/common/api/categories";
import { DEFAULT_CATEGORY_COLORS } from "@/common/constants/category-colors";
import type { ICategory } from "@/common/interfaces/category.interface";
import { resolveCategoryColor } from "@/common/constants/category-colors";
import {
  buildCategoryTree,
  collectDescendantIdSet,
  flattenCategoryTreeForList,
  getCategoryParentId,
  getParentSelectOptions,
} from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormPriceInput, FormSelect } from "@/components/common/form/FormFields";
import { CategoryColorPicker } from "@/components/common/form/CategoryColorPicker";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";
import { CategoryKind } from "@/types/enums";

export function CategoriesPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<ICategory | null>(null);
  const [title, setTitle] = useState("");
  const [parentId, setParentId] = useState("");
  const [isProjectKind, setIsProjectKind] = useState(false);
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLORS[0]);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const categoryRows = useMemo(() => {
    if (!categories?.length) return [];
    return flattenCategoryTreeForList(buildCategoryTree(categories));
  }, [categories]);

  const filteredCategoryRows = useMemo(() => {
    const query = search.trim();
    if (!query) return categoryRows;
    return categoryRows.filter(({ category }) => category.title.includes(query));
  }, [categoryRows, search]);

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
    setColor(DEFAULT_CATEGORY_COLORS[0]);
    setMonthlyLimit("");
    setOpen(true);
  }

  function openEdit(cat: ICategory) {
    setEditItem(cat);
    setTitle(cat.title);
    setParentId(getCategoryParentId(cat) ?? "");
    setIsProjectKind(cat.kind === CategoryKind.PROJECT);
    setColor(cat.color || DEFAULT_CATEGORY_COLORS[0]);
    setMonthlyLimit(cat.monthlyLimit ? String(cat.monthlyLimit) : "");
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
        color,
        monthlyLimit: monthlyLimit.trim() || "0",
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

      showToast(t("ذخیره شد"), "success");
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
      showToast(t("حذف شد"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t("دسته‌بندی‌ها")}</h2>
          <p className="text-sm text-muted">{t("دسته‌های اصلی و زیردسته‌ها")}</p>
        </div>
        <Button
          isIconOnly
          className="bg-accent text-accent-foreground"
          onPress={openCreate}
        >
          <Add size={20} />
        </Button>
      </div>

      <FormInput
        label={t("جستجو")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("نام دسته‌بندی…")}
      />

      {!filteredCategoryRows.length ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Category size={36} className="mx-auto mb-3 text-muted" />
          <p>{search.trim() ? "دسته‌ای با این نام پیدا نشد" : "دسته‌بندی‌ای وجود ندارد"}</p>
        </div>
      ) : (
        <div className="pb-card-grid">
          {filteredCategoryRows.map(({ category, depth }, index) => (
            <div
              key={category._id}
              className="flex items-center justify-between rounded-2xl border border-border/50 bg-surface px-4 py-3 lg:ms-0"
              style={depth > 0 ? { marginInlineStart: depth * 16 } : undefined}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: resolveCategoryColor(category.color, index),
                  }}
                />
                <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{category.title}</span>
                  {category.kind === CategoryKind.PROJECT ? (
                    <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                      پروژه
                    </span>
                  ) : null}
                  {category.monthlyLimit && category.monthlyLimit > 0 ? (
                    <span className="rounded-md bg-surface-secondary px-1.5 py-0.5 text-[10px] text-muted">
                      سقف {category.monthlyLimit.toLocaleString("fa-IR")}
                    </span>
                  ) : null}
                </div>
                {depth > 0 ? (
                  <p className="text-xs text-muted">{t("زیردسته")}</p>
                ) : null}
                </div>
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
                label={t("عنوان")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <FormSelect
                label={t("دسته والد")}
                placeholder={t("بدون والد")}
                selectedKey={parentId || "none"}
                onSelectionChange={(key) => setParentId(key === "none" ? "" : key)}
                options={parentOptions}
              />
              <CategoryColorPicker value={color} onChange={setColor} />
              <FormPriceInput
                label={t("سقف خرج ماهانه (اختیاری)")}
                value={monthlyLimit}
                onChange={setMonthlyLimit}
              />
              <p className="text-xs text-muted">
                ۰ یعنی بدون محدودیت — عبور از سقف مجاز است ولی مانده منفی می‌شود
              </p>
              <div className="flex items-center justify-between rounded-xl border border-border/50 bg-surface-secondary px-3 py-3">
                <div>
                  <p className="text-sm font-medium">{t("نوع پروژه")}</p>
                  <p className="text-xs text-muted">{t("برای مدیریت قرارداد و پرداخت‌های خرد")}</p>
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
