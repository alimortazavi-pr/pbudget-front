"use client";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@heroui/react";

import * as assetsApi from "@/common/api/assets";
import { ASSET_KIND_TILE_ORDER } from "@/common/constants/asset-kinds";
import type { AssetKind, IAsset } from "@/common/interfaces/asset.interface";
import { formatQuantity, sanitizeQuantityInput } from "@/common/utils/asset-format";
import { toEnglishDigits, toPersianDigits } from "@/common/utils/persian-digits";
import { FormInput, FormSelect } from "@/components/common/form/FormFields";
import { useTranslation } from "@/i18n";

export type InvestmentLedgerValue = {
  enabled: boolean;
  /** Existing asset to add to; "" = describe a new one (kind/title/unit). */
  assetId: string;
  kind: AssetKind;
  title: string;
  unit: string;
  quantity: string;
};

export const initialInvestmentLedger: InvestmentLedgerValue = {
  enabled: false,
  assetId: "",
  kind: "currency",
  title: "",
  unit: "",
  quantity: "",
};

const NEW_ASSET = "new";

/** What the server needs: add to an asset, or one to find-or-create. */
export function investmentPayload(value: InvestmentLedgerValue) {
  const quantity = toEnglishDigits(value.quantity);
  return value.assetId
    ? { assetId: value.assetId, quantity }
    : { kind: value.kind, title: value.title.trim(), unit: value.unit.trim(), quantity };
}

export function isInvestmentComplete(value: InvestmentLedgerValue) {
  return Number(toEnglishDigits(value.quantity)) > 0 && (Boolean(value.assetId) || Boolean(value.title.trim()));
}

/**
 * "This expense bought an asset": adds the amount to the matching asset
 * (same kind, name and unit) or creates it, using the expense as its cost.
 */
export function InvestmentLedgerSection({
  value,
  onChange,
  linked,
}: {
  value: InvestmentLedgerValue;
  onChange: (patch: Partial<InvestmentLedgerValue>) => void;
  /** The transaction is already an investment (editing). */
  linked?: boolean;
}) {
  const { t } = useTranslation();
  const [assets, setAssets] = useState<IAsset[]>([]);

  useEffect(() => {
    if (!value.enabled) return;
    void assetsApi
      .fetchAssets()
      .then((data) => setAssets(data.assets))
      .catch(() => setAssets([]));
  }, [value.enabled]);

  const options = useMemo(
    () => [
      ...assets.map((asset) => ({
        id: asset._id,
        label: `${asset.title} · ${toPersianDigits(formatQuantity(asset.quantity))} ${asset.unit}`,
      })),
      { id: NEW_ASSET, label: "دارایی جدید…" },
    ],
    [assets],
  );
  const kindOptions = ASSET_KIND_TILE_ORDER.map((kind) => ({ id: kind, label: t(`feat.assets.kind.${kind}`) }));
  const selected = assets.find((asset) => asset._id === value.assetId);
  const unitName = selected?.unit || value.unit.trim() || t(`feat.assets.unit.${value.kind}`);
  // A new asset that matches an existing one (same kind, name and unit) is added to it.
  const match = !value.assetId
    ? assets.find(
        (asset) =>
          asset.kind === value.kind &&
          asset.title.trim() === value.title.trim() &&
          (asset.unit || "").trim() === (value.unit.trim() || t(`feat.assets.unit.${value.kind}`)),
      )
    : undefined;

  function pickKind(kind: AssetKind) {
    onChange({ kind, title: t(`feat.assets.defaultTitle.${kind}`), unit: t(`feat.assets.unit.${kind}`) });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4" data-testid="investment-ledger">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">این خرید، سرمایه‌گذاری است</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            مثلاً دلار یا طلا خریدید؟ مقدارش به دارایی‌هایتان اضافه می‌شود و همین مبلغ، قیمت خریدش حساب می‌شود.
          </p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(enabled) => {
            if (enabled && !value.assetId && !value.title) {
              onChange({ enabled, kind: "currency", title: t("feat.assets.defaultTitle.currency"), unit: t("feat.assets.unit.currency") });
            } else onChange({ enabled });
          }}
          size="sm"
          aria-label="این خرید، سرمایه‌گذاری است"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {value.enabled ? (
        <div className="space-y-3 border-t border-border/40 pt-3">
          {assets.length ? (
            <FormSelect
              label="به کدام دارایی اضافه شود؟"
              selectedKey={value.assetId || NEW_ASSET}
              onSelectionChange={(key) => onChange({ assetId: key === NEW_ASSET ? "" : key })}
              options={options}
            />
          ) : null}

          {!value.assetId ? (
            <>
              <FormSelect
                label="نوع دارایی"
                selectedKey={value.kind}
                onSelectionChange={(key) => pickKind(key as AssetKind)}
                options={kindOptions}
              />
              <div className="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
                <FormInput label="نام" value={value.title} maxLength={80} onChange={(e) => onChange({ title: e.target.value })} />
                <FormInput label="واحد" value={value.unit} maxLength={20} onChange={(e) => onChange({ unit: e.target.value })} />
              </div>
            </>
          ) : null}

          <FormInput
            label={`چه مقدار خریدید؟ (${unitName})`}
            value={toPersianDigits(value.quantity).replace(/\./g, "٫")}
            inputMode="decimal"
            dir="ltr"
            className="text-left"
            placeholder={toPersianDigits("0")}
            onChange={(e) => onChange({ quantity: sanitizeQuantityInput(e.target.value) })}
          />

          <p className="text-xs leading-6 text-muted">
            {selected
              ? `به «${selected.title}» اضافه می‌شود.`
              : match
                ? `«${match.title}» را از قبل دارید؛ به همان اضافه می‌شود.`
                : "دارایی تازه‌ای با این نام ساخته می‌شود."}
            {linked ? " با ویرایش یا حذف این تراکنش، دارایی هم به‌روز می‌شود." : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
