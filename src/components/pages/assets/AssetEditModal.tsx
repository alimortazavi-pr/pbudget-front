"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as assetsApi from "@/common/api/assets";
import { ASSET_KIND_TILE_ORDER } from "@/common/constants/asset-kinds";
import type { AssetKind, IAsset } from "@/common/interfaces/asset.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormSelect, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";

type Props = {
  open: boolean;
  asset: IAsset | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

/** Name, kind, unit and a note. Prices and trades have their own places. */
export function AssetEditModal({ open, asset, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<AssetKind>("other");
  const [unit, setUnit] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !asset) return;
    setTitle(asset.title);
    setKind(asset.kind);
    setUnit(asset.unit);
    setNote(asset.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill when it opens
  }, [open, asset?._id]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!asset || !title.trim()) return;
    setSaving(true);
    try {
      await assetsApi.updateAsset(asset._id, {
        title: title.trim(),
        kind,
        unit: unit.trim() || undefined,
        note: note.trim(),
      });
      showToast(t("common.saved"), "success");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange}>
      <AppModalDialog className="sm:max-w-md">
        <form onSubmit={(e) => void submit(e)}>
          <AppModalHeader>
            <Modal.Heading>{t("feat.assets.editTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <FormInput label={t("feat.assets.nameLabel")} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
              <FormSelect
                label={t("feat.assets.kindLabel")}
                selectedKey={kind}
                onSelectionChange={(key) => setKind(key as AssetKind)}
                options={ASSET_KIND_TILE_ORDER.map((item) => ({ id: item, label: t(`feat.assets.kind.${item}`) }))}
              />
              <FormInput label={t("feat.assets.unitLabel")} value={unit} maxLength={20} onChange={(e) => setUnit(e.target.value)} />
            </div>
            <FormTextArea label={t("feat.assets.noteLabel")} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
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
