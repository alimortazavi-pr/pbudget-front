"use client";

import { Button, Modal } from "@heroui/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { UserCurrency } from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { BudgetType } from "@/types/enums";

type DeleteTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  price: number;
  type: number;
  currency: UserCurrency;
};

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  price,
  type,
  currency,
}: DeleteTransactionDialogProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const formattedAmount = formatPriceWithCurrency(price, currency);
  const reverseChange = `${
    type === BudgetType.INCOME ? "−" : "+"
  }${formattedAmount}`;

  return createPortal(
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      isDismissable={!isPending}
    >
      <AppModalDialog className="sm:max-w-lg">
        <AppModalHeader>
          <Modal.Heading>{t("dashboard.deleteTransactionTitle")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          <p className="text-sm leading-7 text-muted">
            {t("dashboard.deleteTransactionPrompt", {
              amount: formattedAmount,
            })}
          </p>

          <div className="rounded-xl border border-danger/30 bg-danger/5 p-4">
            <span className="block font-semibold text-foreground">
              {t("dashboard.deleteReverseBalanceTitle")}
            </span>
            <span className="mt-1 block text-xs leading-6 text-muted">
              {t("dashboard.deleteReverseBalanceDescription", {
                change: reverseChange,
              })}
            </span>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="ghost"
            isDisabled={isPending}
            onPress={() => onOpenChange(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="danger"
            isPending={isPending}
            onPress={onConfirm}
          >
            {t("dashboard.confirmDeleteTransaction")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>,
    document.body
  );
}
