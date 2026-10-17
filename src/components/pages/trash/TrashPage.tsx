"use client";

import { FloatingActionBar } from "@/components/common/ui/FloatingActionBar";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Refresh2, TickCircle, Trash } from "iconsax-reactjs";

import * as budgetsApi from "@/common/api/budgets";
import type { TrashedBudget, TrashList } from "@/common/api/budgets";
import { PATHS } from "@/common/constants";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { formatBudgetDate } from "@/common/utils/calendar-date";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { mergeProfileWallet } from "@/common/utils/wallet-balances";
import { resolveBudgetCurrency, resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { bumpBudgetRevision } from "@/stores/budget";
import { setProfile, userSelector } from "@/stores/profile";
import { BudgetType } from "@/types/enums";

function daysLeft(purgeAt: string) {
  return Math.max(0, Math.ceil((new Date(purgeAt).getTime() - Date.now()) / 86_400_000));
}

function ConfirmPurge({
  open,
  count,
  all,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  all: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AppModal open={open} onOpenChange={(next) => (next ? undefined : onClose())} isDismissable={!busy}>
      <AppModalDialog className="sm:max-w-md">
        <AppModalHeader>
          <Modal.Heading>{all ? "خالی کردن سطل زباله" : `حذف همیشگی ${toPersianDigits(count)} تراکنش`}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="text-sm leading-7 text-muted">
          {all ? "همهٔ تراکنش‌های سطل زباله" : "تراکنش‌های انتخاب‌شده"} برای همیشه پاک می‌شوند و دیگر قابل بازگشت نیستند. موجودی کیف پول تغییری نمی‌کند (اثرشان هنگام انتقال به سطل زباله برداشته شده است).
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" isDisabled={busy} onPress={onClose}>
            انصراف
          </Button>
          <Button variant="danger" isPending={busy} onPress={onConfirm}>
            حذف همیشگی
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>,
    document.body,
  );
}

function TrashRow({ item, selected, onToggle }: { item: TrashedBudget; selected: boolean; onToggle: () => void }) {
  const isIncome = item.type === BudgetType.INCOME;
  const currency = resolveBudgetCurrency(item.currency);
  const left = daysLeft(item.purgeAt);
  const category = typeof item.category === "object" && item.category ? item.category.title : "";
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-start transition ${
          selected ? "border-accent bg-accent/7" : "border-border/50 bg-surface hover:border-border"
        }`}
      >
        <span
          aria-hidden
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}
        >
          {selected ? <TickCircle size={16} variant="Bold" /> : null}
        </span>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${isIncome ? "bg-income-soft text-income" : "bg-expense-soft text-expense"}`}>
          {isIncome ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{item.description?.trim() || category || "تراکنش"}</span>
          <span className="block truncate text-xs text-muted">
            {formatBudgetDate(item.year, item.month, item.day, resolveBudgetDateCalendar(item.dateCalendar))}
            {category && item.description?.trim() ? ` · ${category}` : ""}
          </span>
          <span className={`mt-0.5 block text-[11px] ${left <= 3 ? "text-danger" : "text-muted"}`}>
            {left ? `${toPersianDigits(left)} روز تا حذف خودکار` : "امروز حذف می‌شود"}
          </span>
        </span>
        <span className={`shrink-0 text-sm font-bold tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
          {isIncome ? "+" : "−"}
          {formatPriceWithCurrency(item.price, currency)}
        </span>
      </button>
    </li>
  );
}

/** Transactions moved to the trash: restore them or delete them for good (auto-deleted after 30 days). */
export function TrashPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<TrashList | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [purge, setPurge] = useState<"none" | "selected" | "all">("none");

  const load = useCallback(async () => {
    try {
      setError(false);
      setData(await budgetsApi.fetchTrash(page));
    } catch {
      setError(true);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => data?.items ?? [], [data]);
  const allSelected = items.length > 0 && items.every((item) => selected.has(item._id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function afterChange(res: Parameters<typeof mergeProfileWallet>[1]) {
    if (user) dispatch(setProfile(mergeProfileWallet(user, res)));
    dispatch(bumpBudgetRevision());
    setSelected(new Set());
    void load();
  }

  async function restore() {
    setBusy(true);
    try {
      const res = await budgetsApi.restoreFromTrash([...selected]);
      afterChange(res);
      if (res.restored.length) showToast(`${toPersianDigits(res.restored.length)} تراکنش بازگردانده شد`, "success");
      if (res.failed.length) showToast(`${toPersianDigits(res.failed.length)} تراکنش بازگردانده نشد: ${res.failed[0].reason}`, "danger");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setBusy(false);
    }
  }

  async function purgeNow() {
    setBusy(true);
    try {
      const res = await budgetsApi.purgeTrash(purge === "all" ? "all" : [...selected]);
      afterChange(res);
      showToast(`${toPersianDigits(res.deleted.length)} تراکنش برای همیشه حذف شد`, "success");
      setPurge("none");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setBusy(false);
    }
  }

  const total = data?.pagination.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-28">
      <PageHeader
        icon={<Trash size={24} variant="Bold" />}
        title="سطل زباله"
        description={`تراکنش‌های حذف‌شده تا ${toPersianDigits(data?.retentionDays ?? 30)} روز این‌جا می‌مانند؛ می‌توانید برشان گردانید یا برای همیشه پاکشان کنید.`}
        actions={
          total ? (
            <Button size="sm" variant="ghost" className="text-danger" onPress={() => setPurge("all")}>
              خالی کردن سطل
            </Button>
          ) : null
        }
      />

      {error ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-center text-sm">
          <p>بارگذاری سطل زباله ممکن نشد.</p>
          <Button size="sm" variant="secondary" className="mt-3" onPress={() => void load()}>
            تلاش دوباره
          </Button>
        </div>
      ) : data === null ? (
        <div className="space-y-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="pb-shimmer h-16 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 p-10 text-center">
          <Trash size={40} className="text-muted" />
          <p className="font-semibold">سطل زباله خالی است</p>
          <p className="max-w-xs text-sm text-muted">هر تراکنشی را که حذف کنید و «انتقال به سطل زباله» را بزنید، این‌جا می‌بینید.</p>
          <Link href={PATHS.HOME} className="pb-press pb-ghost-btn mt-1">
            بازگشت به تراکنش‌ها
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted">{toPersianDigits(total)} تراکنش در سطل زباله</span>
            <Button size="sm" variant="ghost" onPress={() => setSelected(allSelected ? new Set() : new Set(items.map((item) => item._id)))}>
              {allSelected ? "لغو انتخاب همه" : "انتخاب همه"}
            </Button>
          </div>
          <ul className="space-y-2">
            {items.map((item) => (
              <TrashRow key={item._id} item={item} selected={selected.has(item._id)} onToggle={() => toggle(item._id)} />
            ))}
          </ul>
          {data.pagination.totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 text-sm">
              <Button size="sm" variant="ghost" isDisabled={page <= 1} onPress={() => setPage((value) => value - 1)}>
                قبلی
              </Button>
              <span className="text-muted">
                صفحهٔ {toPersianDigits(page)} از {toPersianDigits(data.pagination.totalPages)}
              </span>
              <Button size="sm" variant="ghost" isDisabled={page >= data.pagination.totalPages} onPress={() => setPage((value) => value + 1)}>
                بعدی
              </Button>
            </div>
          ) : null}
        </>
      )}

      {selected.size ? (
        <FloatingActionBar label="عملیات سطل زباله">
          <span className="text-sm font-semibold">{toPersianDigits(selected.size)} انتخاب شد</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-danger" isDisabled={busy} onPress={() => setPurge("selected")}>
              <Trash size={16} />
              حذف همیشگی
            </Button>
            <Button size="sm" isPending={busy} onPress={() => void restore()}>
              <Refresh2 size={16} />
              بازگردانی
            </Button>
          </div>
        </FloatingActionBar>
      ) : null}

      <ConfirmPurge
        open={purge !== "none"}
        all={purge === "all"}
        count={selected.size}
        busy={busy}
        onClose={() => setPurge("none")}
        onConfirm={() => void purgeNow()}
      />
    </div>
  );
}
