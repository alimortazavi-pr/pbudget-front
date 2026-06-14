"use client";

import { Modal } from "@heroui/react";

import { AppModal } from "@/components/common/ui/AppModal";
import { ShellAccountMenu } from "@/components/common/layout/ShellAccountMenu";

type AppDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppDrawer({ open, onOpenChange }: AppDrawerProps) {
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      placement="bottom"
      backdropClassName="backdrop-blur-sm"
    >
      <Modal.Dialog className="rounded-t-3xl border border-border/50 bg-surface p-0">
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-border" />
        <div className="p-5">
          <ShellAccountMenu
            variant="drawer"
            onNavigate={() => onOpenChange(false)}
          />
        </div>
      </Modal.Dialog>
    </AppModal>
  );
}
