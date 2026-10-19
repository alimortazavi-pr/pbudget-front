"use client";

import { useTranslation } from "@/i18n";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, Card, Edit2, Star1, Trash } from "iconsax-reactjs";
import { ArrowSwapHorizontal } from "iconsax-reactjs";

import * as paymentCardsApi from "@/common/api/payment-cards";
import { DEFAULT_CATEGORY_COLORS } from "@/common/constants/category-colors";
import type { IAccountBalance, IAccountTransfer, IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { DEFAULT_USER_PREFERENCES } from "@/common/constants/user-preferences";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { AccountTransferModal } from "@/components/pages/payment-cards/AccountTransferModal";
import { AccountTransfersList } from "@/components/pages/payment-cards/AccountTransfersList";
import { SwitchRow } from "@/components/common/form/FormKit";
import {
  getDefaultPaymentCardId,
  setDefaultPaymentCardId,
} from "@/common/utils/default-payment-card";
import {
  formatCardNumberDisplay,
  normalizeCardNumber,
  paymentCardSubtitle,
} from "@/common/utils/payment-card";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormPriceInput } from "@/components/common/form/FormFields";
import { CategoryColorPicker } from "@/components/common/form/CategoryColorPicker";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";
import { PageHeader } from "@/components/common/layout/PageHeader";

export function PaymentCardsPage() {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<IPaymentCard | null>(null);
  const [title, setTitle] = useState("");
  const [bankName, setBankName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLORS[4]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<IPaymentCard | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [trackBalance, setTrackBalance] = useState(false);
  const [initialBalance, setInitialBalance] = useState("");
  const [balances, setBalances] = useState<IAccountBalance[]>([]);
  const [transfers, setTransfers] = useState<IAccountTransfer[]>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const currency = user?.preferences?.currency ?? DEFAULT_USER_PREFERENCES.currency;

  /** Balances and transfers only exist for accounts that opted in to tracking. */
  const loadAccountData = useCallback(async () => {
    try {
      const [nextBalances, nextTransfers] = await Promise.all([
        paymentCardsApi.fetchAccountBalances(),
        paymentCardsApi.fetchAccountTransfers(),
      ]);
      setBalances(nextBalances);
      setTransfers(nextTransfers);
    } catch {
      // Older servers / no tracked account: the page just shows no balances.
    }
  }, []);

  useEffect(() => {
    setDefaultCardId(getDefaultPaymentCardId(user?._id));
    void paymentCardsApi
      .fetchPaymentCards()
      .then(setCards)
      .catch((err) => showErrorToast(err))
      .finally(() => setLoading(false));
    void loadAccountData();
  }, [user?._id, loadAccountData]);

  const trackedCards = cards.filter((card) => card.trackBalance);
  const balanceByCard = new Map(balances.map((item) => [item.cardId, item.balance]));

  function toggleDefaultCard(card: IPaymentCard) {
    const nextId = defaultCardId === card._id ? null : card._id;
    setDefaultPaymentCardId(nextId, user?._id);
    setDefaultCardId(nextId);
    showToast(
      nextId ? t("auto.k3f39d26f2a") : t("auto.k25dc526b9c"),
      "success",
    );
  }

  function openCreate() {
    setEditItem(null);
    setTitle("");
    setBankName("");
    setLastFour("");
    setColor(DEFAULT_CATEGORY_COLORS[4]);
    setTrackBalance(false);
    setInitialBalance("");
    setOpen(true);
  }

  function openEdit(card: IPaymentCard) {
    setEditItem(card);
    setTitle(card.title);
    setBankName(card.bankName);
    setLastFour(card.lastFour);
    setColor(card.color || DEFAULT_CATEGORY_COLORS[4]);
    setTrackBalance(Boolean(card.trackBalance));
    setInitialBalance(card.initialBalance ? String(card.initialBalance) : "");
    setOpen(true);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        bankName: bankName.trim(),
        lastFour: normalizeCardNumber(lastFour),
        color,
        // Only sent when it matters, so people who never use tracking see no change.
        ...(trackBalance || editItem?.trackBalance
          ? {
              trackBalance,
              initialBalance: trackBalance ? initialBalance.replace(/^-$/, "0") || "0" : "0",
            }
          : {}),
      };

      if (editItem) {
        const updated = await paymentCardsApi.updatePaymentCard(editItem._id, payload);
        setCards((prev) => prev.map((card) => (card._id === updated._id ? updated : card)));
      } else {
        const created = await paymentCardsApi.createPaymentCard(payload);
        setCards((prev) => [...prev, created]);
      }

      showToast(t("common.saved"), "success");
      setOpen(false);
      void loadAccountData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(card: IPaymentCard) {
    setRemoveBusy(true);
    try {
      await paymentCardsApi.softDeletePaymentCard(card._id);
      setCards((prev) => prev.filter((item) => item._id !== card._id));
      void loadAccountData();
      if (defaultCardId === card._id) {
        setDefaultPaymentCardId(null, user?._id);
        setDefaultCardId(null);
      }
      showToast(t("common.deleted"), "success");
      setRemoving(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setRemoveBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<Card size={24} variant="Bold" />}
        title={t("nav.myCards")}
        description={
          <>
            {t("auto.keb25d51f69")}
            {t("auto.ke3e7d93891")}
          </>
        }
        actions={
          <>
            {trackedCards.length >= 2 ? (
              <Button variant="secondary" onPress={() => setTransferOpen(true)}>
                <ArrowSwapHorizontal size={18} />
                {t("feat.accounts.transferAction")}
              </Button>
            ) : null}
            <Button className="bg-accent text-accent-foreground" onPress={openCreate}>
              <Add size={18} />
              {t("auto.k480ffe699b")}
            </Button>
          </>
        }
      />

      {!loading && cards.length > 0 && trackedCards.length === 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-bold text-foreground">{t("feat.accounts.introTitle")}</p>
            <p className="text-sm leading-7 text-muted">{t("feat.accounts.introBody")}</p>
          </div>
          <Button
            variant="secondary"
            className="shrink-0"
            onPress={() => openEdit({ ...cards[0], trackBalance: true })}
          >
            {t("feat.accounts.introAction", { title: cards[0].title })}
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("common.loading")}</div>
      ) : cards.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Card size={36} className="mx-auto mb-3 text-muted" />
          <p className="text-muted">{t("auto.k1686153266")}</p>
        </div>
      ) : (
        <div className="space-y-3" data-tour="cards-list">
          {cards.map((card) => (
            <article key={card._id} className="glass flex items-center justify-between gap-3 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span
                  className="h-10 w-10 rounded-xl"
                  style={{ backgroundColor: card.color || "#3b82f6" }}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{card.title}</p>
                    {defaultCardId === card._id ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                        {t("auto.kc2d5d42b5f")}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted">
                    {paymentCardSubtitle(card.bankName, card.lastFour) ||
                      t("auto.ke3686141e8")}
                  </p>
                  {card.trackBalance && balanceByCard.has(card._id) ? (
                    <p
                      className={`mt-0.5 text-sm font-semibold ${
                        (balanceByCard.get(card._id) ?? 0) < 0 ? "text-danger" : "text-success"
                      }`}
                    >
                      {t("feat.accounts.balanceLine", {
                        amount: formatPriceWithCurrency(balanceByCard.get(card._id) ?? 0, currency),
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant={defaultCardId === card._id ? "primary" : "ghost"}
                  data-tour="cards-default"
                  aria-label={
                    defaultCardId === card._id
                      ? t("auto.k6003326f42")
                      : t("auto.k709c0ac893")
                  }
                  onPress={() => toggleDefaultCard(card)}
                >
                  <Star1
                    size={16}
                    variant={defaultCardId === card._id ? "Bold" : "Linear"}
                  />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" aria-label={t("common.edit")} onPress={() => openEdit(card)}>
                  <Edit2 size={16} />
                </Button>
                <Button isIconOnly size="sm" variant="danger" aria-label={t("common.delete")} onPress={() => setRemoving(card)}>
                  <Trash size={16} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      {transfers.length > 0 ? (
        <AccountTransfersList
          transfers={transfers}
          cards={cards}
          currency={currency}
          onChanged={() => void loadAccountData()}
        />
      ) : null}

      <AccountTransferModal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        cards={trackedCards}
        currency={currency}
        onDone={() => void loadAccountData()}
      />

      <AppModal open={open} onOpenChange={setOpen}>
        <AppModalDialog className="sm:max-w-md">
          <form onSubmit={(e) => void save(e)}>
            <AppModalHeader onClose={() => setOpen(false)}>
              <Modal.Heading>{editItem ? t("auto.kae26d3633e") : t("auto.k480ffe699b")}</Modal.Heading>
            </AppModalHeader>
            <Modal.Body className="space-y-4">
              <FormInput label={t("auto.k0f2c6c83bc")} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("auto.k3aa276a7d3")} />
              <FormInput label={t("auto.kc7d822aca0")} value={bankName} onChange={(e) => setBankName(e.target.value)} />
              <FormInput
                label={t("auto.k9aec5fb1f2")}
                value={formatCardNumberDisplay(lastFour)}
                onChange={(e) => setLastFour(normalizeCardNumber(e.target.value))}
                inputMode="numeric"
                placeholder={t("auto.kbe5f36097a")}
                maxLength={19}
              />
              <CategoryColorPicker value={color} onChange={setColor} />
              <SwitchRow
                label={t("feat.accounts.trackBalance")}
                description={t("feat.accounts.trackBalanceHint")}
                selected={trackBalance}
                onChange={setTrackBalance}
              />
              {trackBalance ? (
                <FormPriceInput
                  label={t("feat.accounts.initialBalance")}
                  value={initialBalance}
                  onChange={setInitialBalance}
                  currency={currency}
                  allowNegative
                />
              ) : null}
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="ghost" onPress={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" isPending={saving} isDisabled={!title.trim()}>{t("common.save")}</Button>
            </Modal.Footer>
          </form>
        </AppModalDialog>
      </AppModal>

      <AppModal open={Boolean(removing)} onOpenChange={(next) => !next && setRemoving(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader onClose={() => setRemoving(null)}>
            <Modal.Heading>{t("common.deleteConfirm", { name: removing?.title ?? "" })}</Modal.Heading>
          </AppModalHeader>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setRemoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={removeBusy} onPress={() => removing && void remove(removing)}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
