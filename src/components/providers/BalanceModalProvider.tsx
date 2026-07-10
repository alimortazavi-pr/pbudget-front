"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button, Modal } from "@heroui/react";
import type { FormEvent } from "react";

import * as profileApi from "@/common/api/profile";
import { parsePriceInput } from "@/common/utils";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import {
  CURRENCY_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  currencyLabel,
  type UserCurrency,
} from "@/common/constants/user-preferences";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FormPriceInput } from "@/components/common/form/FormFields";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";

type BalanceModalContextValue = {
  openBalanceModal: () => void;
};

const BalanceModalContext = createContext<BalanceModalContextValue | null>(null);

export function useBalanceModal() {
  const ctx = useContext(BalanceModalContext);
  if (!ctx) {
    throw new Error("useBalanceModal must be used within BalanceModalProvider");
  }
  return ctx;
}

function BalanceModalDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<UserCurrency>(
    user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency,
  );
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPrice("");
    setCurrency(user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency);
  }, [open, user?.preferences?.currency]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const delta = parseInt(parsePriceInput(price, true), 10);
    if (!price.trim() || Number.isNaN(delta) || delta === 0) {
      showToast(t("مبلغ تغییر را وارد کنید (مثبت برای افزایش، منفی برای کاهش)"));
      return;
    }

    setLoading(true);
    try {
      const updated = await profileApi.changeUserBudget(delta, currency);
      dispatch(setProfile(updated));
      dispatch(bumpBudgetRevision());
      showToast(
        `موجودی ${currencyLabel(currency)}: ${formatPriceWithCurrency(
          getWalletBalance(updated, currency),
          currency,
        )}`,
        "success",
      );
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const currentBalance = getWalletBalance(user, currency);

  return createPortal(
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <form onSubmit={(e) => void submit(e)}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{t("تنظیم موجودی")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="mb-3 text-sm text-muted">
              موجودی فعلی ({currencyLabel(currency)}):{" "}
              {formatPriceWithCurrency(currentBalance, currency)}
            </p>
            <p className="mb-3 text-xs leading-6 text-muted">
              ارز را انتخاب کنید و مبلغ تغییر را وارد کنید — مثبت برای افزایش،
              منفی برای کاهش. هر ارز موجودی جداگانه دارد.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {CURRENCY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setCurrency(option.id)}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    currency === option.id
                      ? "bg-accent text-accent-foreground"
                      : "bg-surface-secondary text-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <FormPriceInput
              label={`مبلغ افزایش/کاهش (${currencyLabel(currency)})`}
              value={price}
              onChange={setPrice}
              allowNegative
              placeholder={t("مثلاً ۵۰۰۰۰۰ یا -۲۰۰۰۰۰")}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" isPending={loading}>
              اعمال تغییر
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>,
    document.body,
  );
}

export function BalanceModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openBalanceModal = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <BalanceModalContext.Provider value={{ openBalanceModal }}>
      {children}
      <BalanceModalDialog open={open} onOpenChange={setOpen} />
    </BalanceModalContext.Provider>
  );
}
