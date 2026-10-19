"use client";

import { useState } from "react";
import { Wallet2 } from "iconsax-reactjs";

import { resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatBudgetDate } from "@/common/utils";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { FormCategoryComboBox, FormDatePicker, FormSelect } from "@/components/common/form/FormFields";
import { SwitchRow } from "@/components/common/form/FormKit";
import { useTranslation } from "@/i18n";
import { categoriesSelector } from "@/stores/category";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export type AssetRecordValue = {
  date: { year: string; month: string; day: string };
  /** "" = let the server file it under «سرمایه‌گذاری». */
  categoryId: string;
  cardId: string;
};

type Props = {
  side: "buy" | "sell";
  value: AssetRecordValue;
  onChange: (next: AssetRecordValue) => void;
  cards: IPaymentCard[];
  /** Show the on/off switch (buy / sell forms). The "new asset" form uses its own choice instead. */
  toggle?: { record: boolean; onChange: (record: boolean) => void };
};

/**
 * "Also record it in transactions": one calm sentence («با تاریخ امروز در دستهٔ
 * سرمایه‌گذاری ثبت می‌شود») with a "change" link that opens date, category and account.
 */
export function AssetRecordSection({ side, value, onChange, cards, toggle }: Props) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const categories = useAppSelector(categoriesSelector);
  const calendar = resolveBudgetDateCalendar(user?.preferences?.dateCalendar);
  const [open, setOpen] = useState(false);
  const active = toggle ? toggle.record : true;

  const categoryTitle = value.categoryId
    ? ((categories ?? []).find((item) => item._id === value.categoryId)?.title ?? t("feat.assets.autoCategory"))
    : t("feat.assets.autoCategory");
  const dateText = formatBudgetDate(value.date.year, value.date.month, value.date.day, calendar);

  return (
    <div className="space-y-3">
      {toggle ? (
        <SwitchRow
          label={t("feat.assets.recordToggle")}
          description={side === "buy" ? t("feat.assets.recordBuyHint") : t("feat.assets.recordSellHint")}
          selected={toggle.record}
          onChange={toggle.onChange}
        />
      ) : null}

      {active ? (
        <div className="rounded-2xl border border-border/50 bg-surface-secondary/50 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
              <Wallet2 size={17} variant="Bulk" />
            </span>
            <div className="min-w-0 flex-1 text-sm leading-7">
              <p>
                {t("feat.assets.recordSummary", { date: dateText })}{" "}
                <span className="inline-flex items-center rounded-full border border-border/60 bg-surface px-2.5 py-0.5 text-xs font-semibold">
                  {categoryTitle}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                aria-expanded={open}
                className="text-xs font-semibold text-accent hover:underline"
              >
                {open ? t("feat.assets.recordHide") : t("feat.assets.recordChange")}
              </button>
            </div>
          </div>

          {open ? (
            <div className="mt-3 space-y-4 border-t border-border/40 pt-3">
              <FormDatePicker
                label={t("feat.assets.date")}
                year={value.date.year}
                month={value.date.month}
                day={value.date.day}
                inModal
                calendarType={calendar}
                onChange={(date) => onChange({ ...value, date })}
              />
              <FormCategoryComboBox
                label={t("feat.assets.categoryLabel")}
                placeholder={t("feat.assets.autoCategory")}
                selectedKey={value.categoryId || undefined}
                onSelectionChange={(key) => onChange({ ...value, categoryId: key })}
                options={getCategorySelectOptions(categories ?? [])}
                emptyMessage={t("common.noCategoryRegistered")}
              />
              {cards.length > 0 ? (
                <FormSelect
                  label={side === "buy" ? t("budget.paymentCardSource") : t("budget.paymentCardDestination")}
                  selectedKey={value.cardId || "none"}
                  onSelectionChange={(key) => onChange({ ...value, cardId: key === "none" ? "" : key })}
                  options={[
                    { id: "none", label: t("budget.noCard") },
                    ...cards.map((card) => ({ id: card._id, label: card.title })),
                  ]}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
