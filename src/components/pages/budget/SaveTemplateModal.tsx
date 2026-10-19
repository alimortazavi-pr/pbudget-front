"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import { FormInput } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTitle: string;
  onSave: (title: string) => Promise<void>;
};

/** Asks for a title only; the other values come from the form that is open. */
export function SaveTemplateModal({ open, onOpenChange, defaultTitle, onSave }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setTitle(defaultTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill the suggestion when it opens
  }, [open]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(title.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} size="sm">
      <AppModalDialog>
        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{t("feat.templates.saveTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-3">
            <p className="text-xs leading-6 text-muted">{t("feat.templates.saveHint")}</p>
            <FormInput
              label={t("feat.templates.titleLabel")}
              value={title}
              maxLength={60}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" onPress={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" isPending={saving} isDisabled={!title.trim()}>
              {t("common.save")}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>
  );
}
