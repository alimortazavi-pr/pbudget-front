"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Edit2, TickCircle, Trash } from "iconsax-reactjs";

import * as templatesApi from "@/common/api/transaction-templates";
import type { ITransactionTemplate } from "@/common/interfaces/transaction-template.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
  modalSheetBodyClass,
} from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ITransactionTemplate[];
  onChanged: () => void;
};

/** A plain list to rename or delete templates. */
export function ManageTemplatesModal({ open, onOpenChange, templates, onChanged }: Props) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState("");
  const [busyId, setBusyId] = useState("");
  const [removing, setRemoving] = useState<ITransactionTemplate | null>(null);

  async function rename(template: ITransactionTemplate) {
    const title = draft.trim();
    if (!title || title === template.title) {
      setEditingId("");
      return;
    }
    setBusyId(template._id);
    try {
      await templatesApi.updateTemplate(template._id, { title });
      showToast(t("common.saved"), "success");
      setEditingId("");
      onChanged();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusyId("");
    }
  }

  async function remove() {
    if (!removing) return;
    setBusyId(removing._id);
    try {
      await templatesApi.deleteTemplate(removing._id);
      showToast(t("common.deleted"), "success");
      setRemoving(null);
      onChanged();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusyId("");
    }
  }

  return (
    <>
      {/* The list hides while the delete confirmation is up; that is not the user closing it. */}
      <AppModal open={open && !removing} onOpenChange={(next) => !removing && onOpenChange(next)} mobileFull>
        <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{t("feat.templates.manageTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className={`${modalSheetBodyClass} space-y-2`}>
            {templates.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">{t("feat.templates.empty")}</p>
            ) : (
              templates.map((template) => (
                <div
                  key={template._id}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-surface-secondary/50 px-3 py-2"
                >
                  {editingId === template._id ? (
                    <form
                      className="flex min-w-0 flex-1 items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        // Portals bubble React events: don't submit the transaction form behind.
                        e.stopPropagation();
                        void rename(template);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <FormInput
                          label={t("feat.templates.titleLabel")}
                          value={draft}
                          maxLength={60}
                          autoFocus
                          onChange={(e) => setDraft(e.target.value)}
                        />
                      </div>
                      <Button isIconOnly type="submit" size="sm" isPending={busyId === template._id} aria-label={t("common.save")}>
                        <TickCircle size={16} />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{template.title}</p>
                        <p className="text-xs text-muted">
                          {template.type === 0 ? t("budget.income") : t("budget.expense")}
                        </p>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("common.edit")}
                        onPress={() => {
                          setEditingId(template._id);
                          setDraft(template.title);
                        }}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button isIconOnly size="sm" variant="danger" aria-label={t("common.delete")} onPress={() => setRemoving(template)}>
                        <Trash size={16} />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </Modal.Body>
        </AppModalDialog>
      </AppModal>

      <AppModal open={Boolean(removing)} onOpenChange={(next) => !next && setRemoving(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader onClose={() => setRemoving(null)}>
            <Modal.Heading>{t("common.deleteConfirm", { name: removing?.title ?? "" })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setRemoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={Boolean(busyId)} onPress={() => void remove()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </>
  );
}
