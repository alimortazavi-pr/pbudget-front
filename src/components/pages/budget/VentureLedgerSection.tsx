"use client";

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
  if (typeof venture === "string") return "کسب‌وکار مشترک";
  return venture.title;
}

export function LinkedVentureSummary({ venture }: LinkedVentureSummaryProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <p className="text-sm font-medium">مرتبط با کسب‌وکار مشترک</p>
      <div className="rounded-xl bg-accent/10 px-3 py-3 text-sm text-accent">
        <p className="font-semibold">{resolveVentureTitle(venture)}</p>
      </div>
      <p className="text-xs leading-6 text-muted">
        این تراکنش بین شما و شرکا در این کسب‌وکار قابل مشاهده است. برای تغییر، به
        صفحه کسب‌وکار بروید.
      </p>
    </div>
  );
}

export function VentureLedgerSection({
  value,
  onChange,
  projectBlocked,
}: VentureLedgerSectionProps) {
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
        <p className="text-sm font-medium">مرتبط با کسب‌وکار مشترک</p>
        <p className="text-xs leading-6 text-muted">
          تراکنش‌های وصل‌شده به پروژه را نمی‌توان هم‌زمان به کسب‌وکار مشترک وصل کرد.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-surface-secondary/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">مرتبط با کسب‌وکار مشترک</p>
          <p className="mt-1 text-xs text-muted">
            نمایش تراکنش برای شما و شرکای کسب‌وکار
          </p>
        </div>
        <Switch
          isSelected={value.enabled}
          onChange={(selected) => onChange({ enabled: selected })}
          size="sm"
          aria-label="مرتبط با کسب‌وکار مشترک"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      {value.enabled ? (
        <div className="space-y-3 border-t border-border/40 pt-3">
          <FormSelect
            label="کدام کسب‌وکار؟"
            placeholder="یک کسب‌وکار انتخاب کنید"
            selectedKey={value.ventureId || undefined}
            onSelectionChange={(key) => onChange({ ventureId: key })}
            options={ventureOptions}
            emptyMessage="کسب‌وکاری ثبت نشده"
          />
          <p className="text-xs leading-6 text-muted">
            پس از ثبت تراکنش، در تب تراکنش‌های آن کسب‌وکار و محاسبات شراکت نمایش داده
            می‌شود.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { resolveVentureId };
