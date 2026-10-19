"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, ArrowSwapHorizontal, Card } from "iconsax-reactjs";

import * as paymentCardsApi from "@/common/api/payment-cards";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import type { IAccountBalance, IAccountTransfer, IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { getDefaultPaymentCardId, setDefaultPaymentCardId } from "@/common/utils/default-payment-card";
import { formatAmountOnly, formatPriceWithCurrency } from "@/common/utils/format-currency";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { getWalletBalance } from "@/common/utils/wallet-balances";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { OverflowReveal } from "@/components/common/ui/OverflowReveal";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { AccountCard } from "@/components/pages/payment-cards/AccountCard";
import { AccountTransferModal } from "@/components/pages/payment-cards/AccountTransferModal";
import { AccountTransfersList } from "@/components/pages/payment-cards/AccountTransfersList";
import { CardFormModal } from "@/components/pages/payment-cards/CardFormModal";
import { useFeatureFlag } from "@/components/providers/SubscriptionAccessProvider";
import { useTranslation } from "@/i18n";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export function PaymentCardsPage() {
  const { t } = useTranslation();
  const { displayCurrencyLabel } = useCurrencyLabels();
  const user = useAppSelector(userSelector);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;
  const unit = displayCurrencyLabel(currency);
  const { ready: planReady, enabled: balancesEnabled } = useFeatureFlag("account_balances");

  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [balances, setBalances] = useState<IAccountBalance[]>([]);
  const [transfers, setTransfers] = useState<IAccountTransfer[]>([]);
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ open: boolean; card: IPaymentCard | null; track?: boolean }>({ open: false, card: null });
  const [transfer, setTransfer] = useState<{ open: boolean; fromId?: string }>({ open: false });
  const [removing, setRemoving] = useState<IPaymentCard | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const load = useCallback(async () => {
    // Wait for the plan: balances/transfers endpoints answer 403 when the feature is off.
    if (!planReady) return;
    try {
      const [nextCards, nextBalances, nextTransfers] = await Promise.all([
        paymentCardsApi.fetchPaymentCards(),
        balancesEnabled ? paymentCardsApi.fetchAccountBalances().catch(() => [] as IAccountBalance[]) : Promise.resolve([] as IAccountBalance[]),
        balancesEnabled ? paymentCardsApi.fetchAccountTransfers().catch(() => [] as IAccountTransfer[]) : Promise.resolve([] as IAccountTransfer[]),
      ]);
      setCards(nextCards);
      setBalances(nextBalances);
      setTransfers(nextTransfers);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setLoading(false);
    }
  }, [planReady, balancesEnabled]);

  useEffect(() => {
    setDefaultCardId(getDefaultPaymentCardId(user?._id));
    void load();
  }, [user?._id, load]);

  const balanceById = useMemo(() => new Map(balances.map((row) => [row.cardId, row])), [balances]);
  const tracked = cards.filter((card) => card.trackBalance && balanceById.has(card._id));
  const trackedSum = tracked.reduce((sum, card) => sum + (balanceById.get(card._id)?.balance ?? 0), 0);
  const wallet = getWalletBalance(user, currency);
  const diff = wallet - trackedSum;

  function toggleDefault(card: IPaymentCard) {
    const nextId = defaultCardId === card._id ? null : card._id;
    setDefaultPaymentCardId(nextId, user?._id);
    setDefaultCardId(nextId);
    showToast(nextId ? t("auto.k3f39d26f2a") : t("auto.k25dc526b9c"), "success");
  }

  async function confirmRemove() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      await paymentCardsApi.softDeletePaymentCard(removing._id);
      if (defaultCardId === removing._id) {
        setDefaultPaymentCardId(null, user?._id);
        setDefaultCardId(null);
      }
      showToast(t("common.deleted"), "success");
      setRemoving(null);
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setRemoveBusy(false);
    }
  }

  const tile = (label: string, amount: number) => (
    <div className="min-w-0 rounded-2xl bg-white/12 px-3.5 py-3">
      <p className="text-[11px] text-white/80">{label}</p>
      <OverflowReveal full={`${formatPriceWithCurrency(amount, currency)}`} className="mt-0.5 truncate text-lg font-extrabold lg:text-xl">
        {formatAmountOnly(amount, currency)} <span className="text-[11px] font-medium text-white/80">{unit}</span>
      </OverflowReveal>
    </div>
  );

  return (
    <div className="space-y-5">
      <PageHeroSection
        variant="teal"
        eyebrow={t("feat.accounts.eyebrow")}
        title={t("nav.myCards")}
        description={t("feat.accounts.subtitle")}
        aside={
          <Button
            className="bg-white/95 font-semibold text-teal-700"
            data-tour="cards-add"
            data-testid="account-add"
            onPress={() => setForm({ open: true, card: null })}
          >
            <Add size={18} />
            {t("feat.accounts.add")}
          </Button>
        }
        footer={
          cards.length && balancesEnabled ? (
            <div className="mt-5" data-testid="accounts-summary">
              <div className={`grid gap-2 ${tracked.length ? "grid-cols-2" : "grid-cols-1"}`}>
                {tracked.length ? tile(t("feat.accounts.accountsTotal"), trackedSum) : null}
                {tile(t("feat.accounts.walletTotal"), wallet)}
              </div>
              {tracked.length && diff !== 0 ? (
                <p className="mt-2.5 rounded-xl bg-white/10 px-3 py-2 text-xs leading-6 text-white/90" data-testid="accounts-diff">
                  {diff > 0
                    ? t("feat.accounts.diffMore", { amount: formatPriceWithCurrency(diff, currency) })
                    : t("feat.accounts.diffLess", { amount: formatPriceWithCurrency(-diff, currency) })}
                </p>
              ) : null}
            </div>
          ) : null
        }
      />

      {balancesEnabled && tracked.length >= 2 ? (
        <div className="flex justify-end">
          <Button variant="secondary" onPress={() => setTransfer({ open: true })}>
            <ArrowSwapHorizontal size={18} />
            {t("feat.accounts.transferAction")}
          </Button>
        </div>
      ) : null}

      {loading || !planReady ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pb-shimmer h-60 rounded-3xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <section className="pb-pop flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center" data-testid="accounts-empty">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600">
            <Card size={30} variant="Bulk" />
          </span>
          <p className="font-bold">{t("feat.accounts.emptyTitle")}</p>
          <p className="mt-1 max-w-sm text-sm leading-7 text-muted">{t("feat.accounts.emptyHint")}</p>
          <Button className="mt-5" onPress={() => setForm({ open: true, card: null })}>
            <Add size={18} />
            {t("feat.accounts.firstAccount")}
          </Button>
        </section>
      ) : (
        <div className="pb-card-grid !gap-4 md:grid-cols-2 xl:grid-cols-3" data-tour="cards-list">
          {cards.map((card) => (
            <AccountCard
              key={card._id}
              card={card}
              balancesEnabled={balancesEnabled}
              balance={card.trackBalance ? balanceById.get(card._id)?.balance : undefined}
              currency={currency}
              isDefault={defaultCardId === card._id}
              canTransfer={tracked.length >= 2}
              onTransfer={() => setTransfer({ open: true, fromId: card._id })}
              onTrack={() => setForm({ open: true, card, track: true })}
              onEdit={() => setForm({ open: true, card })}
              onDelete={() => setRemoving(card)}
              onToggleDefault={() => toggleDefault(card)}
            />
          ))}
        </div>
      )}

      {balancesEnabled && transfers.length > 0 ? (
        <AccountTransfersList transfers={transfers} cards={cards} currency={currency} onChanged={() => void load()} />
      ) : null}

      <CardFormModal
        open={form.open}
        card={form.card}
        balancesEnabled={balancesEnabled}
        startWithBalance={form.track}
        balance={form.card ? balanceById.get(form.card._id) : undefined}
        currency={currency}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
        onSaved={() => void load()}
      />

      {balancesEnabled ? (
      <AccountTransferModal
        open={transfer.open}
        onOpenChange={(open) => setTransfer((s) => ({ ...s, open }))}
        cards={tracked}
        balances={balanceById}
        defaultFromId={transfer.fromId}
        currency={currency}
        onDone={() => void load()}
      />
      ) : null}

      <AppModal open={Boolean(removing)} onOpenChange={(next) => !next && setRemoving(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader>
            <Modal.Heading>{t("common.deleteConfirm", { name: removing?.title ?? "" })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">{t("feat.accounts.removeBody")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setRemoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={removeBusy} onPress={() => void confirmRemove()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
