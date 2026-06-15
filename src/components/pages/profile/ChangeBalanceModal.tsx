"use client";

import {
  cloneElement,
  isValidElement,
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { Button, Modal } from "@heroui/react";

import * as profileApi from "@/common/api/profile";
import { toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FormPriceInput } from "@/components/common/form/FormFields";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setProfile, userSelector } from "@/stores/profile";

type ChangeBalanceModalProps = {
  trigger: ReactNode;
};

export function ChangeBalanceModal({ trigger }: ChangeBalanceModalProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  function openModal() {
    setPrice(user?.budget != null ? String(user.budget) : "");
    setOpen(true);
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const updated = await profileApi.changeUserBudget(
        parseInt(toEnglishDigits(price), 10),
      );
      dispatch(setProfile(updated));
      showToast("موجودی به‌روز شد", "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onPress?: () => void }>, {
        onPress: () => openModal(),
      })
    : (
        <button type="button" className="cursor-pointer" onClick={() => openModal()}>
          {trigger}
        </button>
      );

  return (
    <>
      {triggerNode}
      <AppModal open={open} onOpenChange={setOpen}>
        <AppModalDialog>
          <form onSubmit={(e) => void submit(e)}>
            <AppModalHeader onClose={() => setOpen(false)}>
              <Modal.Heading>ویرایش موجودی</Modal.Heading>
            </AppModalHeader>
            <Modal.Body>
              <p className="mb-3 text-sm text-muted">
                موجودی فعلی: {user?.budget ?? 0} تومان — مقدار جدید را وارد کنید
              </p>
              <FormPriceInput
                label="موجودی جدید"
                value={price}
                onChange={setPrice}
              />
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setOpen(false)}>
                انصراف
              </Button>
              <Button type="submit" isPending={loading}>
                ذخیره
              </Button>
            </Modal.Footer>
          </form>
        </AppModalDialog>
      </AppModal>
    </>
  );
}
