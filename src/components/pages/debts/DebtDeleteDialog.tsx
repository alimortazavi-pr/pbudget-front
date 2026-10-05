"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Radio, RadioGroup } from "@heroui/react";

import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/components/providers/LanguageProvider";

/**
 * Deleting a debt is about the record, not the money: by default the linked
 * transactions stay. Removing them too is an explicit, explained choice.
 */
export function DebtDeleteDialog({
  open,
  onOpenChange,
  hasTransactions,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasTransactions: boolean;
  isPending: boolean;
  onConfirm: (withTransactions: boolean) => void;
}) {
  const { t } = useTranslation();
  const [withTransactions, setWithTransactions] = useState(false);

  useEffect(() => {
    if (open) setWithTransactions(false);
  }, [open]);

  const options = [
    { value: false, title: t("debts.deleteKeep"), hint: t("debts.deleteKeepHint") },
    { value: true, title: t("debts.deleteAll"), hint: t("debts.deleteAllHint") },
  ];

  return (
    <AppModal open={open} onOpenChange={onOpenChange} isDismissable={!isPending}>
      <AppModalDialog className="sm:max-w-lg">
        <AppModalHeader>
          <Modal.Heading>{t("debts.deleteTitle")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-3">
          {hasTransactions ? (
            <RadioGroup
              aria-label={t("debts.deleteTitle")}
              value={String(withTransactions)}
              onChange={(value) => setWithTransactions(value === "true")}
              className="space-y-3"
            >
              {options.map((option) => (
                <Radio
                  key={String(option.value)}
                  value={String(option.value)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 transition ${
                    withTransactions === option.value
                      ? option.value
                        ? "border-danger/50 bg-danger/5"
                        : "border-accent/50 bg-accent/5"
                      : "border-border/60"
                  }`}
                >
                  <Radio.Control>
                    <Radio.Indicator />
                  </Radio.Control>
                  <Radio.Content>
                    <span className="block text-sm font-semibold">{option.title}</span>
                    <span className="mt-0.5 block text-xs leading-6 text-muted">{option.hint}</span>
                  </Radio.Content>
                </Radio>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-sm leading-7 text-muted">{t("debts.deleteKeepHint")}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" isDisabled={isPending} onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" isPending={isPending} onPress={() => onConfirm(hasTransactions && withTransactions)}>
            {t("debts.deleteConfirm")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}
