"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { Button } from "@heroui/react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { useEffect, useMemo, useState } from "react";

import * as paymentCardsApi from "@/common/api/payment-cards";
import type {
  AnalyticsDuration,
  AnalyticsTypeFilter,
} from "@/common/interfaces/analytics.interface";
import type { ICategory } from "@/common/interfaces/category.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatCardNumberForDisplay } from "@/common/utils/payment-card";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { toPersianDigits } from "@/common/utils";
import {
  getJalaliNow,
  JALALI_MONTHS,
  moment,
} from "@/common/utils/jalali-date";
import { FormCategoryComboBox, FormSelect } from "@/components/common/form/FormFields";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";

const DURATION_OPTIONS: Array<{ id: AnalyticsDuration; label: string }> = [
  { id: "daily", label: t("common.daily") },
  { id: "monthly", label: t("common.monthly") },
  { id: "yearly", label: t("common.yearly") },
  { id: "all", label: t("common.all") },
];

const TYPE_OPTIONS: Array<{ id: AnalyticsTypeFilter; label: string }> = [
  { id: "all", label: t("auto.k7a1593d17a") },
  { id: "income", label: t("auto.k5ca05d4f90") },
  { id: "cost", label: t("auto.k6fad4077c9") },
];

function chipClass(active: boolean) {
  return `cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition-colors ${
    active
      ? "border-accent bg-accent text-accent-foreground"
      : "border-border bg-surface-secondary text-muted hover:border-accent/40"
  }`;
}

type AnalysisFiltersProps = {
  duration: AnalyticsDuration;
  year: string;
  month: string;
  day: string;
  category: string;
  paymentCard: string;
  type: AnalyticsTypeFilter;
  compare: boolean;
  categories: ICategory[];
  onChange: (patch: Record<string, string | boolean>) => void;
};

export function AnalysisFilters({
  duration,
  year,
  month,
  day,
  category,
  paymentCard,
  type,
  compare,
  categories,
  onChange,
}: AnalysisFiltersProps) {
  const { t } = useTranslation();
  const categoryOptions = useMemo(
    () => getCategorySelectOptions(categories),
    [categories],
  );
  const [paymentCards, setPaymentCards] = useState<IPaymentCard[]>([]);

  useEffect(() => {
    void paymentCardsApi.fetchPaymentCards().then(setPaymentCards).catch(() => {
      setPaymentCards([]);
    });
  }, []);

  const paymentCardOptions = useMemo(
    () =>
      paymentCards.map((card) => ({
        id: card._id,
        label: [card.title, formatCardNumberForDisplay(card.lastFour, true)]
          .filter(Boolean)
          .join(" · "),
      })),
    [paymentCards],
  );

  const periodTitle = useMemo(() => {
    const monthName = JALALI_MONTHS[Number(month) - 1] ?? month;
    if (duration === "daily") {
      return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
    }
    if (duration === "monthly") {
      return `${monthName} ${toPersianDigits(year)}`;
    }
    if (duration === "yearly") {
      return t("common.jalaliYear", { year: toPersianDigits(year) });
    }
    return t("auto.ke039e3d6b1");
  }, [duration, year, month, day, t]);

  function shiftPeriod(direction: -1 | 1) {
    if (duration === "all") return;

    const anchor = moment(
      `${year}/${month}/${day || 1}`,
      "jYYYY/jM/jD",
    ).locale("fa");

    if (duration === "daily") {
      const next = anchor.clone().add(direction, "day");
      onChange({
        year: String(next.jYear()),
        month: String(next.jMonth() + 1),
        day: String(next.jDate()),
      });
      return;
    }

    if (duration === "monthly") {
      const next = anchor.clone().add(direction, "jMonth");
      onChange({
        year: String(next.jYear()),
        month: String(next.jMonth() + 1),
        day: String(next.jDate()),
      });
      return;
    }

    onChange({ year: String(Number(year) + direction) });
  }

  function goToToday() {
    const now = getJalaliNow();
    onChange({
      year: String(now.jYear()),
      month: String(now.jMonth() + 1),
      day: String(now.jDate()),
    });
  }

  return (
    <section className="glass space-y-4 rounded-2xl p-4 lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold lg:text-lg">{t("auto.k988325ed2c")}</h2>
          <p className="text-sm text-muted">{periodTitle}</p>
        </div>
        {duration !== "all" && (
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label={t("auto.k20c3d22b78")}
              onPress={() => shiftPeriod(-1)}
            >
              <ArrowRight2 size={18} />
            </Button>
            <Button size="sm" variant="ghost" onPress={goToToday}>
              {t("auto.kaac7d1e045")}
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label={t("auto.kaea448a60f")}
              onPress={() => shiftPeriod(1)}
            >
              <ArrowLeft2 size={18} />
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DURATION_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={chipClass(duration === option.id)}
            onClick={() => onChange({ duration: option.id })}
          >
            {option.label}
          </button>
        ))}
      </div>

      {duration !== "all" && (
        <FilterDatePicker
          year={year}
          month={month}
          day={day}
          onChange={(next) =>
            onChange({
              year: next.year,
              month: next.month,
              day: next.day,
            })
          }
        />
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <FormCategoryComboBox
          label={t("auto.kb561a47a9b")}
          placeholder={t("auto.k8215849f02")}
          selectedKey={category || ""}
          onSelectionChange={(key) => onChange({ category: key === "all" ? "" : key })}
          options={[
            { id: "", label: t("auto.k8215849f02") },
            ...categoryOptions,
          ]}
        />
        <FormSelect
          label={t("auto.k16902e87e2")}
          placeholder={t("auto.kf02e485ebb")}
          selectedKey={paymentCard || "all"}
          onSelectionChange={(key) =>
            onChange({ paymentCard: key === "all" ? "" : key })
          }
          options={[
            { id: "all", label: t("auto.kf02e485ebb") },
            ...paymentCardOptions,
          ]}
          emptyMessage={t("auto.k7ef3c81807")}
        />
        <FormSelect
          label={t("auto.kc69c46bb9b")}
          selectedKey={type}
          onSelectionChange={(key) => onChange({ type: key })}
          options={TYPE_OPTIONS.map((option) => ({
            id: option.id,
            label: option.label,
          }))}
        />
      </div>

      {duration !== "all" && (
        <button
          type="button"
          className={chipClass(compare)}
          onClick={() => onChange({ compare: String(!compare) })}
        >
          {compare ? t("auto.k3a87eb3e61") : t("auto.k334896413b")}
        </button>
      )}
    </section>
  );
}
