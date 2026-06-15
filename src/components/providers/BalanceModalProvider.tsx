"use client";

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
import { formatPrice, toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FormPriceInput } from "@/components/common/form/FormFields";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
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
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPrice(user?.budget != null ? String(user.budget) : "");
  }, [open, user?.budget]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const updated = await profileApi.changeUserBudget(
        parseInt(toEnglishDigits(price), 10),
      );
      dispatch(setProfile(updated));
      showToast("موجودی به‌روز شد", "success");
      onOpenChange(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog>
        <form onSubmit={(e) => void submit(e)}>
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>ویرایش موجودی</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="mb-3 text-sm text-muted">
              موجودی فعلی: {formatPrice(user?.budget ?? 0)} — مقدار جدید را وارد کنید
            </p>
            <FormPriceInput label="موجودی جدید" value={price} onChange={setPrice} />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" isPending={loading}>
              ذخیره
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
