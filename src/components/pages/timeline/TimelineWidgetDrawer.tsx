"use client";

import { Modal } from "@heroui/react";
import type { ReactNode } from "react";

import {
  AppModal,
  AppModalHeader,
  AppModalSheet,
  modalSheetBodyClass,
} from "@/components/common/ui/AppModal";

type TimelineWidgetDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
};

export function TimelineWidgetDrawer({
  open,
  onOpenChange,
  title,
  children,
}: TimelineWidgetDrawerProps) {
  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalSheet>
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading>{title}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className={`${modalSheetBodyClass} space-y-3`}>
          {children}
        </Modal.Body>
      </AppModalSheet>
    </AppModal>
  );
}
