"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@heroui/react";

import * as partnersApi from "@/common/api/partners";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { IVenture } from "@/common/interfaces/partner.interface";
import { FormSelect } from "@/components/common/form/FormFields";

export type VentureLedgerValue = {
  enabled: boolean;
  ventureId: string;
};

type VentureLedgerSectionProps = {
  value: VentureLedgerValue;
  onChange: (patch: Partial<VentureLedgerValue>) => void;
  projectBlocked: boolean;
};

type LinkedVentureSummaryProps = {
  venture: NonNullable<IBudget["venture"]> | string;
};

function resolveVentureId(venture: IBudget["venture"]): string {
  if (!venture) return "";
  if (typeof venture === "string") return venture;
  return venture._id;
}

function resolveVentureTitle(
  venture: NonNullable<IBudget["venture"]> | string,
): string {
  if (typeof venture === "string") return t("auto.k4ced105246");
  return venture.title;
}

export function LinkedVentureSummary({ venture }: LinkedVentureSummaryProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <p className="text-sm font-medium">{t("auto.k691d16e3d6")}</p>
      <div className="rounded-xl bg-accent/10 px-3 py-3 text-sm text-accent">
        <p className="font-semibold">{resolveVentureTitle(venture)}</p>
      </div>
      <p className="text-xs leading-6 text-muted">
        {t("auto.k7344ec03a8")}
        {t("auto.k088468c192")}
      </p>
    </div>
  );
}

export function VentureLedgerSection({
  value,
  onChange,
  projectBlocked,
}: VentureLedgerSectionProps) {  const { t } = useTranslation();

  const [ventures, setVentures] = useState<IVenture[]>([]);

  useEffect(() => {
    if (!value.enabled || projectBlocked) return;
    void partnersApi
      .fetchVentures()
      .then(setVentures)
      .catch(() => setVentures([]));
  }, [value.enabled, projectBlocked]);

  const ventureOptions = useMemo(
    () =>
      ventures.map((venture) => ({
        id: venture._id,
        label: venture.title,
      })),
    [ventures],
  );

  if (projectBlocked) {
    return (
      <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
        <p className="text-sm font-medium">{t("auto.k691d16e3d6")}</p>
        <p className="text-xs leading-6 text-muted">
          {t("auto.k15c9c52688")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("auto.k691d16e3d6")}</p>
          <p className="mt-1 text-xs text-muted">
            {t("auto.k66e5eca228")}
          </p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(selected) => onChange({ enabled: selected })}
          size="sm"
          aria-label={t("auto.k691d16e3d6")}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {value.enabled ? (
        <div className="space-y-3 border-t border-border/40 pt-3">
          <FormSelect
            label={t("auto.k006acd5134")}
            placeholder={t("auto.kc351623ec7")}
            selectedKey={value.ventureId || undefined}
            onSelectionChange={(key) => onChange({ ventureId: key })}
            options={ventureOptions}
            emptyMessage={t("auto.k5d24b04648")}
          />
          <p className="text-xs leading-6 text-muted">
            {t("auto.k5401a5ae4d")}
            {t("auto.kb2d8ac8e4d")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { resolveVentureId };
