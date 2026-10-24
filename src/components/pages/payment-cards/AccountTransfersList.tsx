"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { ArrowSwapHorizontal, Edit2, Trash } from "iconsax-reactjs";

import * as paymentCardsApi from "@/common/api/payment-cards";
import type { UserCurrency } from "@/common/constants/user-preferences";
import type { IAccountBalance, IAccountTransfer, IPaymentCard } from "@/common/interfaces/payment-card.interface";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AppModal, AppModalDialog, AppModalHeader, modalSheetBodyClass } from "@/components/common/ui/AppModal";
import { AccountTransferModal } from "@/components/pages/payment-cards/AccountTransferModal";
import { useTranslation } from "@/i18n";

type Props = {
  transfers: IAccountTransfer[];
  /** Every account, so old transfers still show their names. */
  cards: IPaymentCard[];
  /** Accounts that track a balance (the ones a transfer can use). */
  trackedCards: IPaymentCard[];
  balances: Map<string, IAccountBalance>;
  currency: UserCurrency;
  onChanged: () => void;
};

const RECENT_COUNT = 5;

function sortKey(item: IAccountTransfer) {
  return Number(item.year) * 10000 + Number(item.month) * 100 + Number(item.day);
}

function TransferRow({
  transfer,
  title,
  currency,
  onEdit,
  onRemove,
}: {
  transfer: IAccountTransfer;
  title: (id: string) => string;
  currency: UserCurrency;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <ArrowSwapHorizontal size={16} />
        </span>
        <div className="min-w-0">
          <p className="break-words text-sm font-medium leading-6">
            {title(transfer.fromCard)} ← {title(transfer.toCard)}
          </p>
          <p className="break-words text-xs leading-5 text-muted">
            {toPersianDigits(`${transfer.year}/${String(transfer.month).padStart(2, "0")}/${String(transfer.day).padStart(2, "0")}`)}
            {transfer.description ? ` · ${transfer.description}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-sm font-semibold tabular-nums">{formatPriceWithCurrency(transfer.amount, currency)}</span>
        <div className="flex items-center">
          <Button isIconOnly size="sm" variant="ghost" className="!size-7 !min-w-7" aria-label="ویرایش انتقال" onPress={onEdit}>
            <Edit2 size={15} />
          </Button>
          <Button isIconOnly size="sm" variant="ghost" className="!size-7 !min-w-7" aria-label={t("common.delete")} onPress={onRemove}>
            <Trash size={15} />
          </Button>
        </div>
      </div>
    </li>
  );
}

/** Every transfer, page by page (the card on the page only shows the latest few). */
function AllTransfersModal({
  open,
  onOpenChange,
  revision,
  title,
  currency,
  onEdit,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revision: number;
  title: (id: string) => string;
  currency: UserCurrency;
  onEdit: (transfer: IAccountTransfer) => void;
  onRemove: (transfer: IAccountTransfer) => void;
}) {
  const [items, setItems] = useState<IAccountTransfer[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async (next: number, replace: boolean) => {
    setLoading(true);
    setFailed(false);
    try {
      const data = await paymentCardsApi.fetchAccountTransferPage(next);
      setItems((current) => {
        const merged = replace ? data.transfers : [...current, ...data.transfers];
        return merged.filter((item, index) => merged.findIndex((other) => other._id === item._id) === index);
      });
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fresh first page on open and after every edit/delete.
  useEffect(() => {
    if (open) void load(1, true);
  }, [open, revision, load]);

  return (
    <AppModal open={open} onOpenChange={onOpenChange} mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col sm:max-w-lg">
        <AppModalHeader>
          <Modal.Heading>همهٔ انتقال‌ها{total ? ` (${toPersianDigits(total)})` : ""}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className={modalSheetBodyClass}>
          {failed && !items.length ? (
            <div className="py-8 text-center text-sm">
              <p className="text-muted">بارگذاری انتقال‌ها ممکن نشد.</p>
              <Button size="sm" variant="secondary" className="mt-3" onPress={() => void load(1, true)}>
                تلاش دوباره
              </Button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border/40" data-testid="all-transfers">
                {items.map((transfer) => (
                  <TransferRow
                    key={transfer._id}
                    transfer={transfer}
                    title={title}
                    currency={currency}
                    onEdit={() => onEdit(transfer)}
                    onRemove={() => onRemove(transfer)}
                  />
                ))}
              </ul>
              <div className="flex min-h-12 items-center justify-center py-2 text-xs text-muted">
                {loading ? (
                  <Spinner size="sm" />
                ) : page < totalPages ? (
                  <Button size="sm" variant="ghost" onPress={() => void load(page + 1, false)}>
                    نمایش انتقال‌های قدیمی‌تر
                  </Button>
                ) : items.length ? (
                  <span>همهٔ {toPersianDigits(total)} انتقال نمایش داده شد</span>
                ) : (
                  <span>انتقالی ثبت نشده است</span>
                )}
              </div>
            </>
          )}
        </Modal.Body>
      </AppModalDialog>
    </AppModal>
  );
}

/** Latest transfers between accounts, with the full history one tap away. */
export function AccountTransfersList({ transfers, cards, trackedCards, balances, currency, onChanged }: Props) {
  const { t } = useTranslation();
  const [removing, setRemoving] = useState<IAccountTransfer | null>(null);
  // The dialog keeps its transfer while it animates out, so open/close is a separate flag.
  const [editing, setEditing] = useState<IAccountTransfer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const title = (id: string) => cards.find((card) => card._id === id)?.title ?? "حساب حذف‌شده";
  const recent = [...transfers]
    .sort((a, b) => sortKey(b) - sortKey(a) || String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, RECENT_COUNT);

  // The edited transfer's own accounts stay selectable even if one stopped tracking.
  const editCards = editing
    ? [
        ...trackedCards,
        ...cards.filter(
          (card) => (card._id === editing.fromCard || card._id === editing.toCard) && !trackedCards.some((item) => item._id === card._id),
        ),
      ]
    : trackedCards;

  function startEdit(transfer: IAccountTransfer) {
    setEditing(transfer);
    setEditOpen(true);
  }

  function changed() {
    setRevision((value) => value + 1);
    onChanged();
  }

  async function confirmRemove() {
    if (!removing) return;
    setBusy(true);
    try {
      await paymentCardsApi.deleteAccountTransfer(removing._id);
      showToast(t("common.deleted"), "success");
      setRemoving(null);
      changed();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass space-y-2 rounded-2xl p-4" data-testid="account-transfers">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{t("feat.accounts.transfersTitle")}</h2>
        {transfers.length > RECENT_COUNT ? (
          <Button size="sm" variant="ghost" onPress={() => setAllOpen(true)}>
            مشاهدهٔ همه
          </Button>
        ) : null}
      </div>
      <ul className="divide-y divide-border/40">
        {recent.map((transfer) => (
          <TransferRow
            key={transfer._id}
            transfer={transfer}
            title={title}
            currency={currency}
            onEdit={() => startEdit(transfer)}
            onRemove={() => setRemoving(transfer)}
          />
        ))}
      </ul>

      <AllTransfersModal
        open={allOpen}
        onOpenChange={setAllOpen}
        revision={revision}
        title={title}
        currency={currency}
        onEdit={startEdit}
        onRemove={setRemoving}
      />

      <AccountTransferModal
        open={editOpen}
        onOpenChange={setEditOpen}
        cards={editCards}
        balances={balances}
        currency={currency}
        editing={editing}
        onDone={changed}
      />

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
