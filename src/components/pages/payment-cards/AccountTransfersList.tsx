"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { ArrowSwapHorizontal, Trash } from "iconsax-reactjs";

import * as paymentCardsApi from "@/common/api/payment-cards";
import type { UserCurrency } from "@/common/constants/user-preferences";
import type { IAccountTransfer, IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useTranslation } from "@/i18n";

type Props = {
  transfers: IAccountTransfer[];
  cards: IPaymentCard[];
  currency: UserCurrency;
  onChanged: () => void;
};

/** Small history of transfers between accounts, newest first. */
export function AccountTransfersList({ transfers, cards, currency, onChanged }: Props) {
  const { t } = useTranslation();
  const [removing, setRemoving] = useState<IAccountTransfer | null>(null);
  const [busy, setBusy] = useState(false);
  const title = (id: string) => cards.find((card) => card._id === id)?.title ?? "—";
  const recent = [...transfers]
    .sort((a, b) => {
      const key = (item: IAccountTransfer) =>
        Number(item.year) * 10000 + Number(item.month) * 100 + Number(item.day);
      return key(b) - key(a) || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
    })
    .slice(0, 8);

  async function confirmRemove() {
    if (!removing) return;
    setBusy(true);
    try {
      await paymentCardsApi.deleteAccountTransfer(removing._id);
      showToast(t("common.deleted"), "success");
      setRemoving(null);
      onChanged();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass space-y-2 rounded-2xl p-4" data-testid="account-transfers">
      <h2 className="text-sm font-bold">{t("feat.accounts.transfersTitle")}</h2>
      <ul className="divide-y divide-border/40">
        {recent.map((transfer) => (
          <li key={transfer._id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ArrowSwapHorizontal size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {title(transfer.fromCard)} ← {title(transfer.toCard)}
                </p>
                <p className="text-xs text-muted">
                  {toPersianDigits(`${transfer.year}/${String(transfer.month).padStart(2, "0")}/${String(transfer.day).padStart(2, "0")}`)}
                  {transfer.description ? ` · ${transfer.description}` : ""}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="text-sm font-semibold">{formatPriceWithCurrency(transfer.amount, currency)}</span>
              <Button isIconOnly size="sm" variant="ghost" aria-label={t("common.delete")} onPress={() => setRemoving(transfer)}>
                <Trash size={15} />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AppModal open={Boolean(removing)} onOpenChange={(open) => !open && setRemoving(null)} size="sm">
        <AppModalDialog>
          <AppModalHeader onClose={() => setRemoving(null)}>
            <Modal.Heading>{t("feat.accounts.deleteTransferTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body>
            <p className="text-sm leading-7 text-muted">{t("feat.accounts.deleteTransferBody")}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setRemoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" isPending={busy} onPress={() => void confirmRemove()}>
              {t("common.delete")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </section>
  );
}
