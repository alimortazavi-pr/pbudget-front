"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Button, Modal, Switch } from "@heroui/react";

import * as categoriesApi from "@/common/api/categories";
import * as projectsApi from "@/common/api/projects";
import type { ICategory } from "@/common/interfaces/category.interface";
import { toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormPriceInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { categoriesSelector, setCategories } from "@/stores/category";
import { CategoryKind } from "@/types/enums";

type CreateProjectModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (projectId: string) => void;
  usedCategoryIds?: Set<string>;
};

type Mode = "new" | "existing";

function resetFormState() {
  return {
    title: "",
    categoryId: "",
    totalAmount: "",
    description: "",
    fixedIncome: false,
  };
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreated,
  usedCategoryIds,
}: CreateProjectModalProps) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const [mode, setMode] = useState<Mode>("new");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fixedIncome, setFixedIncome] = useState(false);
  const [saving, setSaving] = useState(false);

  const projectCategoryOptions = useMemo(() => {
    return (categories ?? [])
      .filter(
        (cat: ICategory) =>
          cat.kind === CategoryKind.PROJECT && !usedCategoryIds?.has(cat._id),
      )
      .map((cat) => ({ id: cat._id, label: cat.title }));
  }, [categories, usedCategoryIds]);

  const hasExistingCategories = projectCategoryOptions.length > 0;

  useEffect(() => {
    if (!open) return;
    if (hasExistingCategories) {
      setMode("existing");
      setCategoryId(projectCategoryOptions[0]?.id ?? "");
    } else {
      setMode("new");
      setCategoryId("");
    }
    setTitle("");
    setTotalAmount("");
    setDescription("");
    setFixedIncome(false);
  }, [open, hasExistingCategories, projectCategoryOptions]);

  function closeModal() {
    const next = resetFormState();
    setTitle(next.title);
    setCategoryId(next.categoryId);
    setTotalAmount(next.totalAmount);
    setDescription(next.description);
    setFixedIncome(next.fixedIncome);
    onOpenChange(false);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();

    if (!toEnglishDigits(totalAmount)) {
      showToast("مبلغ کل الزامی است");
      return;
    }
    if (mode === "new" && !title.trim()) {
      showToast("عنوان پروژه الزامی است");
      return;
    }
    if (mode === "existing" && !categoryId) {
      showToast("دسته پروژه را انتخاب کنید");
      return;
    }

    setSaving(true);
    try {
      let resolvedCategoryId = categoryId;

      if (mode === "new") {
        const created = await categoriesApi.createCategory({
          title: title.trim(),
          kind: CategoryKind.PROJECT,
        });
        dispatch(setCategories([...(categories ?? []), created]));
        resolvedCategoryId = created._id;
      }

      const project = await projectsApi.createProject({
        categoryId: resolvedCategoryId,
        totalAmount: toEnglishDigits(totalAmount),
        description: description.trim() || undefined,
        fixedIncome,
      });

      showToast("پروژه ایجاد شد", "success");
      closeModal();
      onCreated?.(project._id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <form onSubmit={(e) => void save(e)}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>پروژه جدید</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            {hasExistingCategories && (
              <div className="flex gap-2">
                {(
                  [
                    { id: "new" as const, label: "پروژه جدید" },
                    { id: "existing" as const, label: "دسته موجود" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMode(item.id)}
                    className={`flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      mode === item.id
                        ? "bg-accent text-accent-foreground"
                        : "bg-surface-secondary text-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            {mode === "new" ? (
              <FormInput
                label="عنوان پروژه"
                placeholder="مثلاً طراحی سایت شرکت X"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <FormSelect
                label="دسته پروژه"
                placeholder="انتخاب دسته"
                selectedKey={categoryId || undefined}
                onSelectionChange={(key) => setCategoryId(key)}
                options={projectCategoryOptions}
              />
            )}

            <FormPriceInput
              label="مبلغ کل قرارداد (تومان)"
              value={totalAmount}
              onChange={setTotalAmount}
            />
            <FormTextArea
              label="توضیحات (اختیاری)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
              <div>
                <p className="text-sm font-medium">درآمد ثابت</p>
                <p className="mt-1 text-xs text-muted">مثل حقوق ماهانه با ساعت موظف ثابت</p>
              </div>
              <Switch isSelected={fixedIncome} onChange={setFixedIncome} size="sm">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={closeModal}>
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
