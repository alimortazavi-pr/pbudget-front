"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import type { AnalyticsReport } from "@/common/interfaces/analytics.interface";
import { paymentCardSubtitle } from "@/common/utils/payment-card";
import { formatPrice } from "@/common/utils";

type AnalysisPaymentCardsPanelProps = {
  report: AnalyticsReport;
};

export function AnalysisPaymentCardsPanel({ report }: AnalysisPaymentCardsPanelProps) {
  const { t } = useTranslation();
  const rows = report.byPaymentCard ?? [];
  if (rows.length === 0) return null;

  return (
    <section className="glass rounded-2xl p-4 lg:p-5">
      <div className="mb-4">
        <h3 className="font-bold">{t("تراکنش‌ها بر اساس کارت")}</h3>
        <p className="text-sm text-muted">{t("مبدا پرداخت و مقصد دریافت در این بازه")}</p>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.cardId}
            className="flex items-center justify-between gap-3 rounded-xl bg-surface-secondary/70 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-8 w-8 rounded-lg"
                style={{ backgroundColor: row.color || "#3b82f6" }}
              />
              <div>
                <p className="font-medium">{row.title}</p>
                <p className="text-xs text-muted">
                  {paymentCardSubtitle(row.bankName, row.lastFour) ||
                    `${row.count} تراکنش`}
                </p>
              </div>
            </div>
            <div className="text-left text-sm">
              {row.cost > 0 ? (
                <p className="font-semibold text-expense">-{formatPrice(row.cost)}</p>
              ) : null}
              {row.income > 0 ? (
                <p className="font-semibold text-income">+{formatPrice(row.income)}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
