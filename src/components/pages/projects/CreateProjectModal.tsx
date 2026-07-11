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
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";

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
  const { currencyLabel } = useCurrencyLabels();
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
      showToast(t("auto.k4e18962524"));
      return;
    }
    if (mode === "new" && !title.trim()) {
      showToast(t("auto.ka2bf0280bf"));
      return;
    }
    if (mode === "existing" && !categoryId) {
      showToast(t("auto.k84aa5cb491"));
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

      showToast(t("auto.kf52df98639"), "success");
      closeModal();
      onCreated?.(project._id);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <form onSubmit={(e) => void save(e)}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{t("auto.ka82d423cdf")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            {hasExistingCategories && (
              <div className="flex gap-2">
                {(
                  [
                    { id: "new" as const, label: t("auto.ka82d423cdf") },
                    { id: "existing" as const, label: t("auto.k83f5ac19e5") },
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
                label={t("auto.k7614acb64f")}
                placeholder={t("auto.kf09a60a915")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            ) : (
              <FormSelect
                label={t("auto.k3ea2dbba5d")}
                placeholder={t("auto.k7fcd990e2d")}
                selectedKey={categoryId || undefined}
                onSelectionChange={(key) => setCategoryId(key)}
                options={projectCategoryOptions}
              />
            )}

            <FormPriceInput
              label={
                fixedIncome
                  ? t("projects.monthlySalaryLabel", {
                      currency: currencyLabel(preferredCurrency),
                    })
                  : t("projects.contractTotalLabel", {
                      currency: currencyLabel(preferredCurrency),
                    })
              }
              value={totalAmount}
              onChange={setTotalAmount}
            />
            <FormTextArea
              label={t("auto.k98fdf54bad")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex items-center justify-between rounded-xl bg-surface-secondary p-3">
              <div>
                <p className="text-sm font-medium">{t("auto.k89de01636e")}</p>
                <p className="mt-1 text-xs text-muted">{t("auto.k6123cbdde0")}</p>
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
                    <p className="text-sm font-medium">{t("auto.kebf7642934")}</p>
                    <p className="mt-1 text-xs text-muted">
                      {t("auto.k4e7af32886")}
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
                    <p className="text-sm font-medium">{t("auto.k063dde53ff")}</p>
                    <p className="mt-1 text-xs text-muted">{t("auto.k7e5214ce7e")}</p>
                  </div>
                  <Switch isSelected={fixedIncome} onChange={setFixedIncome} size="sm">
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </div>
                {!fixedIncome ? (
                  <FormPriceInput
                    label={t("projects.hourlyRateLabel", {
                      currency: currencyLabel(preferredCurrency),
                    })}
                    value={hourlyRate}
                    onChange={setHourlyRate}
                  />
                ) : null}
              </>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={closeModal}>
              {t("common.close")}
            </Button>
            <Button type="submit" isPending={saving}>
              {t("common.create")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
