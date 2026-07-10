"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as debtsApi from "@/common/api/debts";
import { useMergedPersons } from "@/common/hooks/useMergedPersons";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { showErrorToast, showToast } from "@/common/utils/toast";
import {
  FormCategoryComboBox,
  FormDatePicker,
  FormPersonComboBox,
  FormPriceInput,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { DebtType } from "@/types/enums";
import { userSelector } from "@/stores/profile";
import { currencyLabel } from "@/common/constants/user-preferences";

type CreateDebtModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (debtId: string) => void;
};

export function CreateDebtModal({ open, onOpenChange, onCreated }: CreateDebtModalProps) {
  const categories = useAppSelector(categoriesSelector);
  const user = useAppSelector(userSelector);
  const preferredCurrency = user?.preferences?.currency ?? "toman";
  const categoryOptions = getCategorySelectOptions(categories ?? []);
  const persons = useMergedPersons(open);
  const now = getJalaliNow();

  const [debtType, setDebtType] = useState(String(DebtType.PAYABLE));
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState(String(now.jYear()));
  const [month, setMonth] = useState(String(now.jMonth() + 1));
  const [day, setDay] = useState(String(now.jDate()));
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!person.trim() || !amount.trim() || !category) {
      showToast("نام طرف حساب، مبلغ و دسته‌بندی الزامی است");
      return;
    }

    setSubmitting(true);
    try {
      const debt = await debtsApi.createStandaloneDebt({
        type: debtType,
        person: person.trim(),
        amount: toEnglishDigits(amount),
        category,
        year: toEnglishDigits(year),
        month: toEnglishDigits(month),
        day: toEnglishDigits(day),
        description: description.trim(),
      });
      showToast("طلب/بدهی ثبت شد", "success");
      onCreated?.(debt._id);
      onOpenChange(false);
      setPerson("");
      setAmount("");
      setCategory("");
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
          <Modal.Heading>ثبت طلب یا بدهی</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="max-h-[70vh] space-y-4 overflow-x-visible overflow-y-auto overscroll-contain">
          <p className="text-sm text-muted">
            مثل پروژه، ابتدا طرف حساب را ثبت کنید. بعداً می‌توانید تراکنش مبدأ یا تسویه را
            از لیست تراکنش‌ها وصل کنید.
          </p>

          <div className="flex gap-2">
            {[
              { id: String(DebtType.RECEIVABLE), label: "طلب" },
              { id: String(DebtType.PAYABLE), label: "بدهی" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDebtType(item.id)}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium ${
                  debtType === item.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <FormPersonComboBox
            label="نام طرف حساب"
            value={person}
            onChange={setPerson}
            options={persons}
          />
          <FormPriceInput label={`مبلغ (${currencyLabel(preferredCurrency)})`} value={amount} onChange={setAmount} />
          <FormCategoryComboBox
            label="دسته‌بندی"
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
          />
          <FormTextArea
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <FormDatePicker
            label="تاریخ ثبت"
            year={year}
            month={month}
            day={day}
            inModal
            onChange={(value) => {
              setYear(value.year);
              setMonth(value.month);
              setDay(value.day);
            }}
          />
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
