"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as checksApi from "@/common/api/checks";
import type { ICheck } from "@/common/interfaces/check.interface";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { CheckType } from "@/types/enums";

type ClearCheckModalProps = {
  check: ICheck | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleared: () => void;
};

export function ClearCheckModal({
  check,
  open,
  onOpenChange,
  onCleared,
}: ClearCheckModalProps) {
  const categories = useAppSelector(categoriesSelector);
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const now = getJalaliNow();

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !check) return;
    setAmount(String(check.amount));
    setNote("");
    setCategory("");
  }, [open, check]);

  async function handleSubmit() {
    if (!check || !category) {
      showToast("دسته‌بندی الزامی است");
      return;
    }

    setSubmitting(true);
    try {
      await checksApi.clearCheck(check._id, {
        category,
        amount: toEnglishDigits(amount),
        year: String(now.jYear()),
        month: String(now.jMonth() + 1),
        day: String(now.jDate()),
        note,
      });
      showToast("چک وصول شد و تراکنش ثبت شد", "success");
      onCleared();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSubmitting(false);
    }
  }

  if (!check) return null;

  const actionLabel =
    check.type === CheckType.RECEIVABLE ? "وصول چک (دریافتی)" : "پرداخت چک";

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog className="max-w-lg">
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading>{actionLabel}</Modal.Heading>
        </Modal.Header>
        <Modal.Body className="space-y-4">
          <p className="text-sm text-muted">
            {check.person} · سررسید {check.dueYear}/{check.dueMonth}/{check.dueDay}
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
            label="یادداشت"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button isPending={submitting} onPress={() => void handleSubmit()}>
            ثبت و ساخت تراکنش
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </AppModal>
  );
}
