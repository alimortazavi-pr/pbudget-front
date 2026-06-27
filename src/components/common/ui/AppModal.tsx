"use client";

import { Modal, useOverlayState } from "@heroui/react";
import { useEffect, type ReactNode } from "react";

import { shouldCloseModalOnInteractOutside } from "@/common/utils/modal-overlay";
import { useRegisterMobileOverlay } from "@/components/providers/MobileOverlayProvider";

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

  useRegisterMobileOverlay(open);

  useEffect(() => {
    state.setOpen(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync external open flag
  }, [open]);

  return (
    <Modal state={state}>
      <Modal.Backdrop
        isDismissable={isDismissable}
        shouldCloseOnInteractOutside={shouldCloseModalOnInteractOutside}
        className={backdropClassName}
      >
        <Modal.Container
          size={mobileFull ? "full" : size}
          placement={mobileFull ? "bottom" : placement}
          className={[
            "max-sm:!max-h-[100dvh] max-sm:!overflow-y-auto max-sm:!overscroll-y-contain",
            mobileFull
              ? "max-sm:!flex max-sm:!h-auto max-sm:!min-h-0 max-sm:!flex-col sm:!h-auto sm:!max-h-[min(90dvh,720px)]"
              : "max-sm:!items-center",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

type AppModalDialogProps = {
  children: ReactNode;
  className?: string;
};

/** Dialog shell with the standard HeroUI close trigger (top-left in RTL). */
export function AppModalDialog({ children, className = "" }: AppModalDialogProps) {
  return (
    <Modal.Dialog className={className}>
      <Modal.CloseTrigger />
      {children}
    </Modal.Dialog>
  );
}

type AppModalSheetProps = {
  children: ReactNode;
  className?: string;
};

/** Dialog shell: full viewport on mobile, compact card on desktop */
export function AppModalSheet({ children, className = "" }: AppModalSheetProps) {
  return (
    <AppModalDialog
      className={`flex w-full min-h-0 max-h-[100dvh] flex-col rounded-none border-0 bg-surface p-0 max-sm:flex-1 sm:h-auto sm:max-h-[min(90dvh,720px)] sm:max-w-md sm:rounded-2xl sm:border sm:border-border/50 ${className}`}
    >
      {children}
    </AppModalDialog>
  );
}

export const modalSheetFormClass = "flex min-h-0 flex-1 flex-col overflow-hidden";
export const modalSheetBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 [-webkit-overflow-scrolling:touch]";
export const modalSheetFooterClass =
  "shrink-0 border-t border-border/40 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]";

type AppModalHeaderProps = {
  children: ReactNode;
  className?: string;
  /** @deprecated Close is handled by Modal.CloseTrigger inside AppModalDialog */
  onClose?: () => void;
};

export function AppModalHeader({ children, className = "" }: AppModalHeaderProps) {
  return (
    <Modal.Header
      className={`border-b border-border/40 px-5 py-4 pe-5 ps-14 ${className}`}
    >
      <div className="min-w-0 text-start">{children}</div>
    </Modal.Header>
  );
}
