"use client";

import { useEffect, useMemo, useState } from "react";
import { Switch } from "@heroui/react";

import * as paymentPlansApi from "@/common/api/payment-plans";
import type { IPaymentPlanOccurrence } from "@/common/interfaces/payment-plan.interface";
import { formatJalaliDate, formatPrice } from "@/common/utils";
import { FormSelect } from "@/components/common/form/FormFields";
import { useTranslation } from "@/components/providers/LanguageProvider";

export type InstallmentLedgerValue = {
  enabled: boolean;
  occurrenceId: string;
};

type InstallmentLedgerSectionProps = {
  value: InstallmentLedgerValue;
  onChange: (patch: Partial<InstallmentLedgerValue>) => void;
};

export function InstallmentLedgerSection({
  value,
  onChange,
}: InstallmentLedgerSectionProps) {
  const { t } = useTranslation();
  const [occurrences, setOccurrences] = useState<IPaymentPlanOccurrence[]>([]);

  useEffect(() => {
    if (!value.enabled) return;
    void paymentPlansApi
      .fetchPendingOccurrenceCandidates()
      .then(setOccurrences)
      .catch(() => setOccurrences([]));
  }, [value.enabled]);

  const options = useMemo(
    () =>
      occurrences.map((item) => ({
        id: item._id,
        label: t("budget.installmentOptionLabel", {
          title: typeof item.plan === "object" ? item.plan.title : "",
          date: formatJalaliDate(String(item.year), String(item.month), String(item.day)),
          amount: formatPrice(item.amount),
        }),
      })),
    [occurrences, t],
  );

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{t("budget.relatedInstallment")}</p>
          <p className="mt-1 text-xs text-muted">{t("budget.relatedInstallmentHint")}</p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(enabled) =>
            onChange({ enabled, occurrenceId: enabled ? value.occurrenceId : "" })
          }
          size="sm"
          aria-label={t("budget.relatedInstallment")}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {value.enabled ? (
        <div className="border-t border-border/40 pt-3">
          <FormSelect
            label={t("budget.selectInstallment")}
            placeholder={t("budget.selectInstallmentPlaceholder")}
            selectedKey={value.occurrenceId || undefined}
            onSelectionChange={(occurrenceId) => onChange({ occurrenceId })}
            options={options}
            emptyMessage={t("budget.noPendingInstallments")}
          />
        </div>
      ) : null}
    </div>
  );
}
