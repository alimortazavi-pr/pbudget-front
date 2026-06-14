"use client";

import { useState } from "react";
import { Button, Modal, Switch } from "@heroui/react";

import * as paymentPlansApi from "@/common/api/payment-plans";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";

type CreatePaymentPlanModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function CreatePaymentPlanModal({
  open,
  onOpenChange,
  onCreated,
}: CreatePaymentPlanModalProps) {
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const now = getJalaliNow();

  const [title, setTitle] = useState("");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [installments, setInstallments] = useState("");
  const [description, setDescription] = useState("");
  const [remindMonthStart, setRemindMonthStart] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim() || !amount.trim()) {
      showToast("عنوان و مبلغ الزامی است");
      return;
    }

    setSubmitting(true);
    try {
      await paymentPlansApi.createPaymentPlan({
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
      });
      showToast("برنامه پرداخت ثبت شد", "success");
      onCreated();
      onOpenChange(false);
      setTitle("");
      setPerson("");
      setAmount("");
      setCategory("");
      setDueDay("1");
      setInstallments("");
      setDescription("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog className="max-w-lg">
        <Modal.CloseTrigger />
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>برنامه پرداخت جدید</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto">
          <p className="text-sm text-muted">
            برای اقساط ماهانه مثل اجاره، وام یا نسیه — هر ماه در روز مشخص یادآوری
            می‌شود.
          </p>

          <FormInput label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} />
          <FormInput
            label="طرف حساب (اختیاری)"
            value={person}
            onChange={(e) => setPerson(e.target.value)}
          />
          <FormInput
            label="مبلغ هر قسط (تومان)"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <FormSelect
            label="دسته‌بندی پیش‌فرض"
            placeholder="برای ثبت خودکار تراکنش"
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage="دسته‌ای ثبت نشده"
          />
          <FormInput
            label="روز سررسید هر ماه (۱ تا ۳۱)"
            inputMode="numeric"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
          <FormInput
            label="تعداد اقساط (خالی = تا لغو)"
            inputMode="numeric"
            value={installments}
            onChange={(e) => setInstallments(e.target.value)}
          />
          <FormTextArea
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-surface-secondary/60 p-3">
            <div>
              <p className="text-sm font-medium">یادآوری اول ماه</p>
              <p className="text-xs text-muted">لیست اقساط این ماه در تلگرام</p>
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
      </Modal.Dialog>
    </AppModal>
  );
}
