"use client";

import { Button } from "@heroui/react";
import { ArrowSwapHorizontal, Edit2, Star1, Trash } from "iconsax-reactjs";

import type { UserCurrency } from "@/common/constants/user-preferences";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatAmountOnly } from "@/common/utils/format-currency";
import { formatCardNumberForDisplay } from "@/common/utils/payment-card";
import { OverflowReveal } from "@/components/common/ui/OverflowReveal";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useTranslation } from "@/i18n";

type Props = {
  card: IPaymentCard;
  /** undefined = this account does not track a balance. */
  balance?: number;
  /** The plan includes separate balances; otherwise the card is a plain label. */
  balancesEnabled?: boolean;
  currency: UserCurrency;
  isDefault: boolean;
  canTransfer: boolean;
  onTransfer: () => void;
  onTrack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDefault: () => void;
};

/** A bank-card look: colour, bank, last four digits, and the balance when the account keeps one. */
export function AccountCard({
  card,
  balance,
  balancesEnabled = true,
  currency,
  isDefault,
  canTransfer,
  onTransfer,
  onTrack,
  onEdit,
  onDelete,
  onToggleDefault,
}: Props) {
  const { t } = useTranslation();
  const { displayCurrencyLabel } = useCurrencyLabels();
  const color = card.color || "#3b82f6";
  const tracked = balancesEnabled && Boolean(card.trackBalance);
  const digits = formatCardNumberForDisplay(card.lastFour, true);
  const amountText = balance === undefined ? "" : formatAmountOnly(Math.abs(balance), currency);
  const negative = (balance ?? 0) < 0;

  return (
    <article className="overflow-hidden rounded-3xl border border-border/50 bg-surface pb-lift" data-testid="account-card">
      <div
        className="relative isolate min-h-[11rem] overflow-hidden p-5 text-white"
        style={{ background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 55%, #000))` }}
      >
        <span aria-hidden className="pointer-events-none absolute -end-10 -top-10 size-36 rounded-full bg-white/15" />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 start-8 size-40 rounded-full bg-black/10" />

        <div className="relative flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-semibold text-white/90">{card.bankName || t("feat.accounts.noBank")}</p>
          {isDefault ? (
            <span className="shrink-0 rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-sm">
              {t("feat.accounts.defaultBadge")}
            </span>
          ) : null}
        </div>

        <div className={`relative ${balancesEnabled ? "mt-4 min-h-[3.25rem]" : "mt-2"}`}>
          {tracked ? (
            <>
              <p className="text-[11px] text-white/80">{t("feat.accounts.balanceLabel")}</p>
              {balance === undefined ? (
                <p className="text-2xl font-extrabold">—</p>
              ) : (
                <div className="flex min-w-0 items-baseline gap-1.5">
                  <OverflowReveal full={`${negative ? "−" : ""}${amountText} ${displayCurrencyLabel(currency)}`} className="min-w-0 truncate">
                    <span className={`text-2xl font-extrabold tracking-tight ${negative ? "text-rose-100" : ""}`}>
                      {negative ? "−" : ""}
                      {amountText}
                    </span>
                  </OverflowReveal>
                  <span className="shrink-0 text-xs font-medium text-white/80">{displayCurrencyLabel(currency)}</span>
                </div>
              )}
            </>
          ) : balancesEnabled ? (
            <button
              type="button"
              onClick={onTrack}
              className="pb-press inline-flex cursor-pointer items-center rounded-full border border-dashed border-white/60 bg-white/10 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-sm hover:bg-white/20"
            >
              {t("feat.accounts.trackCta")}
            </button>
          ) : null}
        </div>

        <div className={`relative ${balancesEnabled ? "mt-4" : "mt-10"} flex items-end justify-between gap-3`}>
          <p className="min-w-0 truncate font-bold" title={card.title}>
            {card.title}
          </p>
          {digits ? (
            <p className="shrink-0 text-sm tracking-wider text-white/90" dir="ltr">
              {digits}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          {canTransfer && tracked ? (
            <Button size="sm" variant="ghost" className="text-accent" onPress={onTransfer}>
              <ArrowSwapHorizontal size={16} />
              {t("feat.accounts.transferShort")}
            </Button>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            type="button"
            className={`pb-icon-btn ${isDefault ? "!text-accent" : ""}`}
            aria-label={isDefault ? t("auto.k6003326f42") : t("auto.k709c0ac893")}
            aria-pressed={isDefault}
            onClick={onToggleDefault}
          >
            <Star1 size={17} variant={isDefault ? "Bold" : "Linear"} />
          </button>
          <button type="button" className="pb-icon-btn" aria-label={t("common.edit")} onClick={onEdit}>
            <Edit2 size={17} />
          </button>
          <button type="button" className="pb-icon-btn hover:!text-danger" aria-label={t("common.delete")} onClick={onDelete}>
            <Trash size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
