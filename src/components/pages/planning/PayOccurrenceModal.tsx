"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as paymentPlansApi from "@/common/api/payment-plans";
import type { IPaymentPlanOccurrence } from "@/common/interfaces/payment-plan.interface";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormCategoryComboBox, FormPriceInput, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { userSelector } from "@/stores/profile";
import { currencyLabel } from "@/common/constants/user-preferences";

type PayOccurrenceModalProps = {
  occurrence: IPaymentPlanOccurrence | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid: () => void;
};

export function PayOccurrenceModal({
  occurrence,
  open,
  onOpenChange,
  onPaid,
}: PayOccurrenceModalProps) {
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const now = getJalaliNow();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !occurrence) return;
    setCategory(occurrence.plan.category?._id ?? "");
    setAmount(String(occurrence.amount));
    setNote("");
  }, [open, occurrence]);

  async function handleSubmit() {
    if (!occurrence || !category) {
      showToast("دسته‌بندی الزامی است");
      return;
    }

    setSubmitting(true);
    try {
      await paymentPlansApi.payOccurrence(occurrence._id, {
        category,
        amount: toEnglishDigits(amount),
        year: String(now.jYear()),
        month: String(now.jMonth() + 1),
        day: String(now.jDate()),
        note,
      });
      showToast("پرداخت ثبت و تراکنش ساخته شد", "success");
      onPaid();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSubmitting(false);
    }
  }

  if (!occurrence) return null;

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>پرداخت {occurrence.plan.title}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          <p className="text-sm text-muted">
            قسط {occurrence.sequence} · سررسید {occurrence.year}/{occurrence.month}/
            {occurrence.day}
          </p>

          <FormPriceInput label={`مبلغ (${currencyLabel(preferredCurrency)})`} value={amount} onChange={setAmount} />

          <FormCategoryComboBox
            label="دسته‌بندی"
            placeholder="جستجو یا انتخاب دسته‌بندی"
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage="دسته‌ای ثبت نشده"
          />

          <FormTextArea
            label="یادداشت این پرداخت"
            placeholder="مثلاً از کارت بانک X پرداخت شد"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button isPending={submitting} onPress={() => void handleSubmit()}>
            ثبت پرداخت
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
