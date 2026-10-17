"use client";

import { Button, Modal } from "@heroui/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { toPersianDigits } from "@/common/utils/persian-digits";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";

/**
 * After a bulk "move to trash": some transactions are linked to debts,
 * installments, checks, boxes or work hours and could only be deleted for good.
 */
export function ConfirmBlockedDialog({
  blocked,
  busy,
  onClose,
  onDeletePermanently,
}: {
  blocked: { id: string; reason: string }[];
  busy: boolean;
  onClose: () => void;
  onDeletePermanently: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const open = blocked.length > 0;
  const reasons = [...new Set(blocked.map((item) => item.reason.replace(/^این تراکنش /, "").replace(/ و فقط به‌طور کامل حذف می‌شود\.$/, "")))];

  return createPortal(
    <AppModal open={open} onOpenChange={(next) => (next ? undefined : onClose())} isDismissable={!busy}>
      <AppModalDialog className="sm:max-w-md">
        <AppModalHeader>
          <Modal.Heading>{toPersianDigits(blocked.length)} تراکنش به سطل زباله نرفت</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-3 text-sm leading-7">
          <p className="text-muted">
            این تراکنش‌ها به بخش دیگری وصل‌اند ({reasons.join("، ")}) و فقط می‌توان آن‌ها را به‌طور کامل حذف کرد. با حذف کامل، اتصالشان هم اصلاح می‌شود (مثلاً طلب/بدهی یا قسط دوباره باز می‌شود).
          </p>
          <p className="font-medium">این‌ها را برای همیشه حذف کنیم؟</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" isDisabled={busy} onPress={onClose}>
            نگه‌شان دار
          </Button>
          <Button variant="danger" isPending={busy} onPress={onDeletePermanently}>
            حذف همیشگی
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>,
    document.body,
  );
}
