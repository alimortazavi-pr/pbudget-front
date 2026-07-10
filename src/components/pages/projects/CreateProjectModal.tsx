"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

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
import { userSelector } from "@/stores/profile";
import { currencyLabel } from "@/common/constants/user-preferences";

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
    trackWorkTime: false,
    showWorkTimeOnDashboard: false,
    hourlyRate: "",
  };
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreated,
  usedCategoryIds,
}: CreateProjectModalProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const [mode, setMode] = useState<Mode>("new");
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [description, setDescription] = useState("");
  const [fixedIncome, setFixedIncome] = useState(false);
  const [trackWorkTime, setTrackWorkTime] = useState(false);
  const [showWorkTimeOnDashboard, setShowWorkTimeOnDashboard] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");
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
    setTrackWorkTime(false);
    setShowWorkTimeOnDashboard(false);
    setHourlyRate("");
  }, [open, hasExistingCategories, projectCategoryOptions]);

  function closeModal() {
    const next = resetFormState();
    setTitle(next.title);
    setCategoryId(next.categoryId);
    setTotalAmount(next.totalAmount);
    setDescription(next.description);
    setFixedIncome(next.fixedIncome);
    setTrackWorkTime(next.trackWorkTime);
    setShowWorkTimeOnDashboard(next.showWorkTimeOnDashboard);
    setHourlyRate(next.hourlyRate);
    onOpenChange(false);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();

    if (!toEnglishDigits(totalAmount)) {
      showToast(t("مبلغ کل الزامی است"));
      return;
    }
    if (mode === "new" && !title.trim()) {
      showToast(t("عنوان پروژه الزامی است"));
      return;
    }
    if (mode === "existing" && !categoryId) {
      showToast(t("دسته پروژه را انتخاب کنید"));
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
        trackWorkTime,
        showWorkTimeOnDashboard: trackWorkTime && showWorkTimeOnDashboard,
        hourlyRate:
          trackWorkTime && !fixedIncome ? toEnglishDigits(hourlyRate) : undefined,
      });

      showToast(t("پروژه ایجاد شد"), "success");
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
            <Modal.Heading>{t("پروژه جدید")}</Modal.Heading>
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
                label={t("عنوان پروژه")}
                placeholder={t("مثلاً طراحی سایت شرکت X")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <FormSelect
                label={t("دسته پروژه")}
                placeholder={t("انتخاب دسته")}
                selectedKey={categoryId || undefined}
                onSelectionChange={(key) => setCategoryId(key)}
                options={projectCategoryOptions}
              />
            )}

            <FormPriceInput
              label={
                fixedIncome
                  ? `حقوق ماهانه (${currencyLabel(preferredCurrency)})`
                  : `مبلغ کل قرارداد (${currencyLabel(preferredCurrency)})`
              }
              value={totalAmount}
              onChange={setTotalAmount}
            />
            <FormTextArea
              label={t("توضیحات (اختیاری)")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
              <div>
                <p className="text-sm font-medium">{t("ثبت ساعت کاری")}</p>
                <p className="mt-1 text-xs text-muted">{t("ورود/خروج و حضور و غیاب")}</p>
              </div>
              <Switch isSelected={trackWorkTime} onChange={setTrackWorkTime} size="sm">
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
            {trackWorkTime ? (
              <>
                <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
                  <div>
                    <p className="text-sm font-medium">{t("نمایش در صفحه اصلی")}</p>
                    <p className="mt-1 text-xs text-muted">
                      میانبر ورود/خروج و حضور امروز در داشبورد
                    </p>
                  </div>
                  <Switch
                    isSelected={showWorkTimeOnDashboard}
                    onChange={setShowWorkTimeOnDashboard}
                    size="sm"
                  >
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
                  <div>
                    <p className="text-sm font-medium">{t("درآمد ثابت")}</p>
                    <p className="mt-1 text-xs text-muted">{t("مثل حقوق ماهانه با ساعت موظف ثابت")}</p>
                  </div>
                  <Switch isSelected={fixedIncome} onChange={setFixedIncome} size="sm">
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>
                {!fixedIncome ? (
                  <FormPriceInput
                    label={`نرخ ساعتی کار (${currencyLabel(preferredCurrency)})`}
                    value={hourlyRate}
                    onChange={setHourlyRate}
                  />
                ) : null}
              </>
            ) : null}
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
