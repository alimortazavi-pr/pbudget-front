"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";

import * as checksApi from "@/common/api/checks";
import { getJalaliNow, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import {
  FormDatePicker,
  FormInput,
  FormPersonComboBox,
  FormPriceInput,
  FormTextArea,
} from "@/components/common/form/FormFields";
import { AppModal, AppModalHeader } from "@/components/common/ui/AppModal";
import { CheckType } from "@/types/enums";

type CreateCheckModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persons: string[];
  onCreated: () => void;
};

export function CreateCheckModal({
  open,
  onOpenChange,
  persons,
  onCreated,
}: CreateCheckModalProps) {
  const now = getJalaliNow();
  const [type, setType] = useState(String(CheckType.PAYABLE));
  const [amount, setAmount] = useState("");
  const [person, setPerson] = useState("");
  const [bankName, setBankName] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [dueYear, setDueYear] = useState(String(now.jYear()));
  const [dueMonth, setDueMonth] = useState(String(now.jMonth() + 1));
  const [dueDay, setDueDay] = useState(String(now.jDate()));
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fresh = getJalaliNow();
    setDueYear(String(fresh.jYear()));
    setDueMonth(String(fresh.jMonth() + 1));
    setDueDay(String(fresh.jDate()));
  }, [open]);

  function handleDueDateChange(value: {
    year: string;
    month: string;
    day: string;
  }) {
    setDueYear(value.year);
    setDueMonth(value.month);
    setDueDay(value.day);
  }

  async function handleSubmit() {
    if (!person.trim() || !amount.trim()) {
      showToast("طرف حساب و مبلغ الزامی است");
      return;
    }

    setSubmitting(true);
    try {
      await checksApi.createCheck({
        type,
        amount: toEnglishDigits(amount),
        person: person.trim(),
        bankName,
        checkNumber,
        dueYear: toEnglishDigits(dueYear),
        dueMonth: toEnglishDigits(dueMonth),
        dueDay: toEnglishDigits(dueDay),
        description,
      });
      showToast("چک ثبت شد", "success");
      onCreated();
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <Modal.Dialog className="max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>ثبت چک جدید</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="max-h-[70vh] space-y-4 overflow-y-auto">
          <div className="flex gap-2">
            {[
              { id: String(CheckType.RECEIVABLE), label: "چک دریافتی" },
              { id: String(CheckType.PAYABLE), label: "چک پرداختی" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id)}
                className={`flex-1 cursor-pointer rounded-xl border px-3 py-2 text-sm font-medium ${
                  type === item.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <FormPriceInput label="مبلغ (تومان)" value={amount} onChange={setAmount} />
          <FormPersonComboBox
            label="طرف حساب"
            value={person}
            onChange={setPerson}
            options={persons}
          />
          <FormInput
            label="بانک"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <FormInput
            label="شماره چک"
            value={checkNumber}
            onChange={(e) => setCheckNumber(e.target.value)}
          />
          <FormDatePicker
            label="تاریخ سررسید"
            year={dueYear}
            month={dueMonth}
            day={dueDay}
            inModal
            onChange={handleDueDateChange}
          />
          <FormTextArea
            label="توضیحات"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button isPending={submitting} onPress={() => void handleSubmit()}>
            ثبت چک
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </AppModal>
  );
}
