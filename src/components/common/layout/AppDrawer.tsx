"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Modal } from "@heroui/react";

import {
  AppModal,
  AppModalDialog, AppModalHeader,
} from "@/components/common/ui/AppModal";
import { ShellAccountMenu } from "@/components/common/layout/ShellAccountMenu";
import { useAppMode } from "@/components/providers/AppModeProvider";

type AppDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AppDrawer({ open, onOpenChange }: AppDrawerProps) {
  const { t } = useTranslation();
  const { isSimple } = useAppMode();
  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      size="full"
      placement="bottom"
      backdropClassName="backdrop-blur-sm"
    >
      <AppModalDialog className="flex max-h-[100dvh] w-full min-h-0 flex-col rounded-none border-0 bg-surface p-0">
        <AppModalHeader onClose={() => onOpenChange(false)}>
          <Modal.Heading className="text-base font-bold">{t("common.menuAndAccount")}</Modal.Heading>
        </AppModalHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
          <ShellAccountMenu
            variant="drawer"
            onNavigate={() => onOpenChange(false)}
            showPlanning={!isSimple}
          />
        </div>
      </AppModalDialog>
    </AppModal>
  );
}
