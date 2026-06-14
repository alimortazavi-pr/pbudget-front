"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as paymentPlansApi from "@/common/api/payment-plans";
import type { IPaymentPlanOccurrence } from "@/common/interfaces/payment-plan.interface";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";

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
      <Modal.Dialog className="max-w-lg">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading>پرداخت {occurrence.plan.title}</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="space-y-4">
          <p className="text-sm text-muted">
            قسط {occurrence.sequence} · سررسید {occurrence.year}/{occurrence.month}/
            {occurrence.day}
          </p>

          <FormInput
            label="مبلغ (تومان)"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <FormSelect
            label="دسته‌بندی"
            placeholder="انتخاب دسته"
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
      </Modal.Dialog>
    </AppModal>
  );
}
