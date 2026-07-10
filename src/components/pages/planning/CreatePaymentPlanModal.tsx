"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useState } from "react";
import { Button, Modal, Switch } from "@heroui/react";

import * as paymentPlansApi from "@/common/api/payment-plans";
import * as projectsApi from "@/common/api/projects";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormCategoryComboBox, FormInput, FormPersonComboBox, FormPriceInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { useMergedPersons } from "@/common/hooks/useMergedPersons";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";
import { currencyLabel } from "@/common/constants/user-preferences";

type CreatePaymentPlanModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (planId?: string) => void;
  defaultProjectId?: string;
};

export function CreatePaymentPlanModal({
  open,
  onOpenChange,
  onCreated,
  defaultProjectId,
}: CreatePaymentPlanModalProps) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const persons = useMergedPersons(open);
  const now = getJalaliNow();

  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [installments, setInstallments] = useState("");
  const [description, setDescription] = useState("");
  const [remindMonthStart, setRemindMonthStart] = useState(true);
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [projectOptions, setProjectOptions] = useState<{ id: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || defaultProjectId) return;
    void projectsApi
      .fetchProjects()
      .then((projects) =>
        setProjectOptions(
          projects.map((project) => ({
            id: project._id,
            label: project.category?.title ?? "پروژه",
          })),
        ),
      )
      .catch(() => undefined);
  }, [open, defaultProjectId]);

  useEffect(() => {
    if (open && defaultProjectId) {
      setProjectId(defaultProjectId);
    }
  }, [open, defaultProjectId]);

  async function handleSubmit() {
    if (!title.trim() || !amount.trim()) {
      showToast(t("عنوان و مبلغ الزامی است"));
      return;
    }

    setSubmitting(true);
    try {
      const result = await paymentPlansApi.createPaymentPlan({
        title: title.trim(),
        person: person.trim(),
        amount: toEnglishDigits(amount),
        category: category || undefined,
        dueDayOfMonth: toEnglishDigits(dueDay),
        totalInstallments: installments ? toEnglishDigits(installments) : undefined,
        startYear: String(now.jYear()),
        startMonth: String(now.jMonth() + 1),
        remindOnMonthStart: remindMonthStart,
        remindDaysBefore: "3",
        description,
        projectId: projectId || defaultProjectId || undefined,
      });
      showToast(t("برنامه پرداخت ثبت شد"), "success");
      onCreated(result.plan._id);
      onOpenChange(false);
      setTitle("");
      setPerson("");
      setAmount("");
      setCategory("");
      setDueDay("1");
      setInstallments("");
      setDescription("");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{t("برنامه پرداخت جدید")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto">
          <p className="text-sm text-muted">
            برای اقساط ماهانه مثل اجاره، وام یا نسیه — هر ماه در روز مشخص یادآوری
            می‌شود.
          </p>

          <FormInput label={t("عنوان")} value={title} onChange={(e) => setTitle(e.target.value)} />
          <FormPersonComboBox
            label={t("طرف حساب (اختیاری)")}
            value={person}
            onChange={setPerson}
            options={persons}
          />
          <FormPriceInput
            label={`مبلغ هر قسط (${currencyLabel(preferredCurrency)})`}
            value={amount}
            onChange={setAmount}
          />
          <FormCategoryComboBox
            label={t("دسته‌بندی پیش‌فرض")}
            placeholder={t("جستجو یا انتخاب دسته‌بندی")}
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage="دسته‌ای ثبت نشده"
          />
          <FormInput
            label={t("روز سررسید هر ماه (۱ تا ۳۱)")}
            inputMode="numeric"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
          <FormInput
            label={t("تعداد اقساط (خالی = تا لغو)")}
            inputMode="numeric"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
          />
          <FormTextArea
            label={t("توضیحات")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {!defaultProjectId && projectOptions.length > 0 && (
            <FormSelect
              label={t("پروژه (اختیاری)")}
              placeholder={t("بدون پروژه")}
              selectedKey={projectId || undefined}
              onSelectionChange={(key) => setProjectId(String(key ?? ""))}
              options={[{ id: "", label: "بدون پروژه" }, ...projectOptions]}
            />
          )}

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-secondary/60 p-3">
            <div>
              <p className="text-sm font-medium">{t("یادآوری اول ماه")}</p>
              <p className="text-xs text-muted">{t("لیست اقساط این ماه در تلگرام")}</p>
            </div>
            <Switch isSelected={remindMonthStart} onChange={setRemindMonthStart} size="sm">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button isPending={submitting} onPress={() => void handleSubmit()}>
            ثبت
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
