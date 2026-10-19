"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";

import * as assetsApi from "@/common/api/assets";
import { ASSET_KIND_META } from "@/common/constants/asset-kinds";
import { ASSET_KINDS, type AssetKind, type IAsset } from "@/common/interfaces/asset.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormPriceInput, FormTextArea } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";

type Props = {
  open: boolean;
  /** null = create a new asset */
  asset: IAsset | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (asset: IAsset) => void;
};

export function AssetFormModal({ open, asset, onOpenChange, onSaved }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<AssetKind>("gold");
  const [unit, setUnit] = useState("");
  const [unitTouched, setUnitTouched] = useState(false);
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(asset?.title ?? "");
    setKind(asset?.kind ?? "gold");
    setUnit(asset?.unit ?? t("feat.assets.unit.gold"));
    setUnitTouched(Boolean(asset));
    setUnitPrice(asset && asset.unitPrice > 0 ? String(asset.unitPrice) : "");
    setNote(asset?.note ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fill when the dialog opens
  }, [open, asset]);

  function pickKind(next: AssetKind) {
    setKind(next);
    if (!unitTouched) setUnit(t(`feat.assets.unit.${next}`));
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        kind,
        unit: unit.trim() || undefined,
        unitPrice: unitPrice ? String(Number(unitPrice)) : undefined,
        note: note.trim(),
      };
      const saved = asset
        ? await assetsApi.updateAsset(asset._id, payload)
        : await assetsApi.createAsset({ ...payload, note: payload.note || undefined });
      showToast(t("common.saved"), "success");
      onOpenChange(false);
      onSaved(saved);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-md">
        <form onSubmit={(e) => void submit(e)} className="flex min-h-0 flex-1 flex-col">
          <AppModalHeader onClose={() => onOpenChange(false)}>
            <Modal.Heading>{asset ? t("feat.assets.editTitle") : t("feat.assets.add")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("feat.assets.kindLabel")}</p>
              <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-4">
                {ASSET_KINDS.map((item) => {
                  const meta = ASSET_KIND_META[item];
                  const selected = kind === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => pickKind(item)}
                      className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs transition-colors ${
                        selected
                          ? "border-accent bg-accent/15 font-semibold text-accent ring-1 ring-accent/35"
                          : "border-border/50 bg-surface-secondary/60 text-muted hover:border-accent/40"
                      }`}
                    >
                      <meta.icon size={22} variant="Bulk" color={meta.color} />
                      {t(`feat.assets.kind.${item}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <FormInput
              label={t("feat.assets.titleLabel")}
              value={title}
              maxLength={80}
              placeholder={t("feat.assets.titlePlaceholder")}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormInput
              label={t("feat.assets.unitLabel")}
              value={unit}
              maxLength={20}
              onChange={(e) => {
                setUnitTouched(true);
                setUnit(e.target.value);
              }}
            />
            <FormPriceInput
              label={t("feat.assets.unitPriceLabel", { unit: unit.trim() || t("feat.assets.unitFallback") })}
              value={unitPrice}
              onChange={setUnitPrice}
              currency={currency}
            />
            <p className="-mt-2 text-xs leading-6 text-muted">{t("feat.assets.unitPriceHint")}</p>
            <FormTextArea label={t("feat.assets.noteLabel")} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </Modal.Body>
          <Modal.Footer className="border-t border-border/40 px-5 py-4">
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
