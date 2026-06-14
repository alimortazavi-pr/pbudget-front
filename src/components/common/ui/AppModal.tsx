"use client";

import { Modal, useOverlayState } from "@heroui/react";
import { useEffect, type ReactNode } from "react";

type AppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  placement?: "center" | "bottom" | "top";
  isDismissable?: boolean;
  backdropClassName?: string;
};

export function AppModal({
  open,
  onOpenChange,
  children,
  size = "md",
  placement = "center",
  isDismissable = true,
  backdropClassName,
}: AppModalProps) {
  const state = useOverlayState({
    isOpen: open,
    onOpenChange,
  });

  useEffect(() => {
    state.setOpen(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync external open flag
  }, [open]);

  return (
    <Modal state={state}>
      <Modal.Backdrop
        isDismissable={isDismissable}
        className={backdropClassName}
      >
        <Modal.Container size={size} placement={placement}>
          {children}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
