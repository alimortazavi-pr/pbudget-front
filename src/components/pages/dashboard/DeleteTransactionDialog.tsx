"use client";

import { Button, Modal } from "@heroui/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { DeleteBudgetBalanceMode } from "@/common/api/budgets";
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
  onConfirm: (mode: DeleteBudgetBalanceMode) => void;
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
  const [mode, setMode] = useState<DeleteBudgetBalanceMode>("preserve");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setMode("preserve");
  }, [open]);

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

          <div
            role="radiogroup"
            aria-label={t("dashboard.deleteTransactionBalanceMode")}
            className="space-y-2"
          >
            <button
              type="button"
              role="radio"
              aria-checked={mode === "preserve"}
              onClick={() => setMode("preserve")}
              className={`w-full rounded-xl border p-4 text-start transition-colors ${
                mode === "preserve"
                  ? "border-accent bg-accent/10"
                  : "border-border/70 bg-surface hover:border-accent/50"
              }`}
            >
              <span className="block font-semibold text-foreground">
                {t("dashboard.deletePreserveBalanceTitle")}
              </span>
              <span className="mt-1 block text-xs leading-6 text-muted">
                {t("dashboard.deletePreserveBalanceDescription")}
              </span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={mode === "reverse"}
              onClick={() => setMode("reverse")}
              className={`w-full rounded-xl border p-4 text-start transition-colors ${
                mode === "reverse"
                  ? "border-warning bg-warning/10"
                  : "border-border/70 bg-surface hover:border-warning/50"
              }`}
            >
              <span className="block font-semibold text-foreground">
                {t("dashboard.deleteReverseBalanceTitle")}
              </span>
              <span className="mt-1 block text-xs leading-6 text-muted">
                {t("dashboard.deleteReverseBalanceDescription", {
                  change: reverseChange,
                })}
              </span>
            </button>
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
            onPress={() => onConfirm(mode)}
          >
            {t("dashboard.confirmDeleteTransaction")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>,
    document.body
  );
}
