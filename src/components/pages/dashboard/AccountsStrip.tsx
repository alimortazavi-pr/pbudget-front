"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import * as paymentCardsApi from "@/common/api/payment-cards";
import { PATHS } from "@/common/constants";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { useFeatureFlag } from "@/components/providers/SubscriptionAccessProvider";
import { useTranslation } from "@/i18n";
import { budgetRevisionSelector } from "@/stores/budget";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

type Row = { card: IPaymentCard; balance: number };

/** Balances of the accounts that keep their own balance. Hidden when there are none. */
export function AccountsStrip() {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const revision = useAppSelector(budgetRevisionSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const [rows, setRows] = useState<Row[]>([]);
  const { enabled } = useFeatureFlag("account_balances");

  useEffect(() => {
    if (!enabled) {
      setRows([]);
      return;
    }
    let alive = true;
    Promise.all([paymentCardsApi.fetchPaymentCards(), paymentCardsApi.fetchAccountBalances()])
      .then(([cards, balances]) => {
        if (!alive) return;
        const byId = new Map(balances.map((item) => [item.cardId, item.balance]));
        setRows(cards.filter((card) => card.trackBalance && byId.has(card._id)).map((card) => ({ card, balance: byId.get(card._id) ?? 0 })));
      })
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [revision, enabled]);

  if (!enabled || !rows.length) return null;

  return (
    <section className="space-y-2" aria-label={t("feat.accounts.stripTitle")} data-testid="accounts-strip">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold">{t("feat.accounts.stripTitle")}</h2>
        <Link href={PATHS.PAYMENT_CARDS} className="text-xs font-semibold text-accent hover:underline">
          {t("feat.accounts.stripAll")}
        </Link>
      </div>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
        {rows.map(({ card, balance }) => (
          <Link
            key={card._id}
            href={PATHS.PAYMENT_CARDS}
            className="glass pb-lift flex min-w-[10.5rem] shrink-0 flex-col gap-1 rounded-2xl px-3.5 py-2.5"
          >
            <span className="flex items-center gap-2 text-xs text-muted">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: card.color || "#3b82f6" }} />
              <span className="max-w-[9rem] truncate">{card.title}</span>
            </span>
            <span className={`text-sm font-extrabold ${balance < 0 ? "text-expense" : ""}`}>
              {formatPriceWithCurrency(balance, currency)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
