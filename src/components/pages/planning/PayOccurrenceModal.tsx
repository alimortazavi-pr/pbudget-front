"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

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
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";

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
  const { t } = useTranslation();
  const { currencyLabel } = useCurrencyLabels();
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
      showToast(t("auto.k23b386cfec"));
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
      showToast(t("auto.kb92d05c117"), "success");
      onPaid();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!occurrence) return null;

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="max-w-lg">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{t("auto.k1025955b55")}{occurrence.plan.title}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          <p className="text-sm text-muted">
            {t("auto.kd673bbfe0f")}{occurrence.sequence} · {t("auto.k8b0f305f8a")}{occurrence.year}/{occurrence.month}/
            {occurrence.day}
          </p>

          <FormPriceInput label={t("budget.amountWithCurrency", { currency: currencyLabel(preferredCurrency) })} value={amount} onChange={setAmount} />

          <FormCategoryComboBox
            label={t("auto.kb561a47a9b")}
            placeholder={t("common.searchCategoryPlaceholder")}
            selectedKey={category || undefined}
            onSelectionChange={(key) => setCategory(key)}
            options={categoryOptions}
            emptyMessage={t("auto.kf4be303fa3")}
          />

          <FormTextArea
            label={t("auto.k1a27826525")}
            placeholder={t("auto.kc2edacde6d")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button isPending={submitting} onPress={() => void handleSubmit()}>
            {t("auto.k53c1fe65ff")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
