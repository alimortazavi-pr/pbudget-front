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
  /** Full-screen sheet on mobile; centered dialog from sm breakpoint up */
  mobileFull?: boolean;
};

export function AppModal({
  open,
  onOpenChange,
  children,
  size = "md",
  placement = "center",
  isDismissable = true,
  backdropClassName,
  mobileFull = false,
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
        <Modal.Container
          size={mobileFull ? "full" : size}
          placement={mobileFull ? "bottom" : placement}
          className={
            mobileFull
              ? "max-sm:!h-[100dvh] max-sm:!max-h-[100dvh] sm:!h-auto sm:!max-h-[min(90dvh,720px)]"
              : undefined
          }
        >
          {children}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

type AppModalSheetProps = {
  children: ReactNode;
  className?: string;
};

/** Dialog shell: full viewport on mobile, compact card on desktop */
export function AppModalSheet({ children, className = "" }: AppModalSheetProps) {
  return (
    <Modal.Dialog
      className={`flex h-[100dvh] max-h-[100dvh] w-full flex-col rounded-none border-0 bg-surface p-0 sm:h-auto sm:max-h-[min(90dvh,720px)] sm:max-w-md sm:rounded-2xl sm:border sm:border-border/50 ${className}`}
    >
      {children}
    </Modal.Dialog>
  );
}

export const modalSheetFormClass = "flex min-h-0 flex-1 flex-col";
export const modalSheetHeaderClass =
  "shrink-0 border-b border-border/40 px-5 py-4";
export const modalSheetBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4";
export const modalSheetFooterClass =
  "shrink-0 border-t border-border/40 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]";
