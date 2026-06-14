"use client";

import { useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as profileApi from "@/common/api/profile";
import { toEnglishDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AppModal, AppModalHeader } from "@/components/common/ui/AppModal";
import { FormInput } from "@/components/common/form/FormFields";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setProfile, userSelector } from "@/stores/profile";

type ChangeBalanceModalProps = {
  trigger: React.ReactNode;
};

export function ChangeBalanceModal({ trigger }: ChangeBalanceModalProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <span className="cursor-pointer" onClick={() => setOpen(true)}>
        {trigger}
      </span>
      <AppModal open={open} onOpenChange={setOpen}>
        <Modal.Dialog>
          <form onSubmit={(e) => void submit(e)}>
            <AppModalHeader onClose={() => setOpen(false)}>
              <Modal.Heading>ویرایش موجودی</Modal.Heading>
            </AppModalHeader>
            <Modal.Body>
              <p className="mb-3 text-sm text-muted">
                موجودی فعلی: {user?.budget ?? 0} تومان — مقدار جدید را وارد کنید
              </p>
              <FormInput
                label="موجودی جدید"
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
        </Modal.Dialog>
      </AppModal>
    </>
  );
}
