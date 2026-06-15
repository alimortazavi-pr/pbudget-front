"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { CloseCircle } from "iconsax-reactjs";
import { useEffect, type ReactNode } from "react";

import { shouldCloseModalOnInteractOutside } from "@/common/utils/modal-overlay";

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

type AppModalSheetProps = {
  children: ReactNode;
  className?: string;
};

/** Dialog shell: full viewport on mobile, compact card on desktop */
export function AppModalSheet({ children, className = "" }: AppModalSheetProps) {
  return (
    <Modal.Dialog
      className={`flex w-full min-h-0 max-h-[100dvh] flex-col rounded-none border-0 bg-surface p-0 max-sm:flex-1 sm:h-auto sm:max-h-[min(90dvh,720px)] sm:max-w-md sm:rounded-2xl sm:border sm:border-border/50 ${className}`}
    >
      {children}
    </Modal.Dialog>
  );
}

export const modalSheetFormClass = "flex min-h-0 flex-1 flex-col overflow-hidden";
export const modalSheetBodyClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 [-webkit-overflow-scrolling:touch]";
export const modalSheetFooterClass =
  "shrink-0 border-t border-border/40 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]";

type ModalCloseButtonProps = {
  onPress: () => void;
  label?: string;
};

/** Close control — sits at the visual top-left in RTL headers */
export function ModalCloseButton({
  onPress,
  label = "بستن",
}: ModalCloseButtonProps) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={label}
      onPress={onPress}
      className="shrink-0 text-muted"
    >
      <CloseCircle size={22} variant="Bold" />
    </Button>
  );
}

type AppModalHeaderProps = {
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function AppModalHeader({
  children,
  onClose,
  className = "",
}: AppModalHeaderProps) {
  return (
    <Modal.Header
      className={`flex flex-row items-start gap-3 border-b border-border/40 px-5 py-4 ${className}`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <ModalCloseButton onPress={onClose} />
    </Modal.Header>
  );
}
