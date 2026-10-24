"use client";

import { Button, Modal } from "@heroui/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash, TrushSquare } from "iconsax-reactjs";

import type { DeleteMode } from "@/common/api/budgets";
import type { UserCurrency } from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";
import { BudgetType } from "@/types/enums";

type DeleteTransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mode: DeleteMode) => void;
  isPending: boolean;
  /** One transaction: its amount and type show the wallet effect. */
  price?: number;
  type?: number;
  currency?: UserCurrency;
  /** Several transactions (bulk delete). */
  count?: number;
};

const OPTIONS: { mode: DeleteMode; title: string; description: string }[] = [
  {
    mode: "trash",
    title: "انتقال به سطل زباله",
    description: "از فهرست و محاسبات حذف می‌شود و تا ۳۰ روز می‌توانید آن را برگردانید.",
  },
  {
    mode: "permanent",
    title: "حذف کامل و همیشگی",
    description: "برای همیشه پاک می‌شود و قابل بازگشت نیست.",
  },
];

/** Asks whether to move transactions to the trash (restorable) or delete them for good. */
export function DeleteTransactionDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  price,
  type,
  currency = "toman",
  count = 1,
}: DeleteTransactionDialogProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<DeleteMode>("trash");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (open) setMode("trash");
  }, [open]);

  if (!mounted) return null;

  const single = count === 1 && price !== undefined && type !== undefined;
  const formattedAmount = single ? formatPriceWithCurrency(price, currency) : "";
  const reverseChange = single ? `${type === BudgetType.INCOME ? "−" : "+"}${formattedAmount}` : "";
  const subject = single ? "این تراکنش" : `${toPersianDigits(count)} تراکنش انتخاب‌شده`;

  return createPortal(
    <AppModal open={open} onOpenChange={onOpenChange} isDismissable={!isPending}>
      <AppModalDialog className="sm:max-w-lg">
        <AppModalHeader>
          <Modal.Heading>{single ? t("dashboard.deleteTransactionTitle") : `حذف ${toPersianDigits(count)} تراکنش`}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          <p className="text-sm leading-7 text-muted">
            {single
              ? t("dashboard.deleteTransactionPrompt", { amount: formattedAmount })
              : `با ${subject} چه کنیم؟`}
          </p>

          <div className="grid gap-2" role="radiogroup" aria-label="نوع حذف">
            {OPTIONS.map((option) => {
              const selected = mode === option.mode;
              const danger = option.mode === "permanent";
              return (
                <button
                  key={option.mode}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMode(option.mode)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-start transition ${
                    selected
                      ? danger
                        ? "border-danger/60 bg-danger/8"
                        : "border-accent/60 bg-accent/8"
                      : "border-border/60 hover:border-border"
                  }`}
                >
                  <span className={`mt-0.5 shrink-0 ${danger ? "text-danger" : "text-accent"}`}>
                    {danger ? <Trash size={22} variant={selected ? "Bold" : "Linear"} /> : <TrushSquare size={22} variant={selected ? "Bold" : "Linear"} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{option.title}</span>
                    <span className="mt-0.5 block text-xs leading-6 text-muted">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="rounded-xl bg-surface-secondary p-3 text-xs leading-6 text-muted">
            {single
              ? t("dashboard.deleteReverseBalanceDescription", { change: reverseChange })
              : "اثر این تراکنش‌ها روی موجودی کیف پول برگردانده می‌شود."}
            {mode === "trash" ? " با بازگرداندن از سطل زباله، این اثر دوباره اعمال می‌شود." : ""}
          </p>
          {mode === "trash" ? (
            <p className="text-xs leading-6 text-muted">
              تراکنش‌هایی که به طلب/بدهی، قسط، چک، صندوق، ساعت کار یا خرید دارایی وصل‌اند به سطل زباله نمی‌روند و فقط حذف کامل می‌شوند؛ اگر بینشان باشد خبرتان می‌کنیم.
            </p>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="ghost" isDisabled={isPending} onPress={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant={mode === "permanent" ? "danger" : "primary"} isPending={isPending} onPress={() => onConfirm(mode)}>
            {mode === "permanent" ? "حذف همیشگی" : "انتقال به سطل زباله"}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>,
    document.body,
  );
}
