"use client";

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
  { id: "daily", label: "روزانه" },
  { id: "monthly", label: "ماهانه" },
  { id: "yearly", label: "سالانه" },
  { id: "all", label: "همه" },
];

const TYPE_OPTIONS: Array<{ id: AnalyticsTypeFilter; label: string }> = [
  { id: "all", label: "همه تراکنش‌ها" },
  { id: "income", label: "فقط دریافتی" },
  { id: "cost", label: "فقط پرداختی" },
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
      return `سال ${toPersianDigits(year)}`;
    }
    return "تمام دوره";
  }, [duration, year, month, day]);

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
          <h2 className="text-base font-bold lg:text-lg">{t("فیلترها")}</h2>
          <p className="text-sm text-muted">{periodTitle}</p>
        </div>
        {duration !== "all" && (
          <div className="flex items-center gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label={t("دوره قبل")}
              onPress={() => shiftPeriod(-1)}
            >
              <ArrowRight2 size={18} />
            </Button>
            <Button size="sm" variant="ghost" onPress={goToToday}>
              امروز
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="secondary"
              aria-label={t("دوره بعد")}
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
          label={t("دسته‌بندی")}
          placeholder={t("همه دسته‌ها")}
          selectedKey={category || ""}
          onSelectionChange={(key) => onChange({ category: key === "all" ? "" : key })}
          options={[
            { id: "", label: "همه دسته‌ها" },
            ...categoryOptions,
          ]}
        />
        <FormSelect
          label={t("کارت")}
          placeholder={t("همه کارت‌ها")}
          selectedKey={paymentCard || "all"}
          onSelectionChange={(key) =>
            onChange({ paymentCard: key === "all" ? "" : key })
          }
          options={[
            { id: "all", label: "همه کارت‌ها" },
            ...paymentCardOptions,
          ]}
          emptyMessage="کارتی ثبت نشده"
        />
        <FormSelect
          label={t("نوع تراکنش")}
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
          {compare ? "✓ مقایسه با دوره قبل" : "مقایسه با دوره قبل"}
        </button>
      )}
    </section>
  );
}
