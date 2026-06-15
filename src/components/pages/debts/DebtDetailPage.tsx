"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowDown, ArrowUp, Profile2User, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as debtsApi from "@/common/api/debts";
import type { IDebt } from "@/common/interfaces/debt.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatJalaliDate, formatPrice, formatCount } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { DebtSettleModal } from "@/components/pages/debts/DebtSettleModal";
import { BudgetType, DebtType } from "@/types/enums";

type DebtDetailPageProps = {
  debtId: string;
};

type TabId = "overview" | "transactions";

function debtTypeLabel(type: number) {
  return type === DebtType.RECEIVABLE ? "طلب" : "بدهی";
}

function statusLabel(status: IDebt["status"]) {
  if (status === "settled") return "تسویه‌شده";
  if (status === "partial") return "تسویه جزئی";
  return "باز";
}

function extractBudgets(debt: IDebt): IBudget[] {
  const map = new Map<string, IBudget>();

  if (typeof debt.sourceBudget === "object" && debt.sourceBudget?._id) {
    map.set(debt.sourceBudget._id, debt.sourceBudget);
  }

  debt.settlements.forEach((settlement) => {
    if (typeof settlement.budget === "object" && settlement.budget?._id) {
      map.set(settlement.budget._id, settlement.budget);
    }
  });

  return Array.from(map.values());
}

export function DebtDetailPage({ debtId }: DebtDetailPageProps) {
  const router = useRouter();
  const [debt, setDebt] = useState<IDebt | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [settleOpen, setSettleOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await debtsApi.fetchDebt(debtId);
      setDebt(detail);
    } catch (err) {
      showErrorToast(err, "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [debtId]);

  useEffect(() => {
    void load();
  }, [load]);

  const budgets = useMemo(() => (debt ? extractBudgets(debt) : []), [debt]);

  const settledAmount = useMemo(() => {
    if (!debt) return 0;
    return debt.totalAmount - debt.remainingAmount;
  }, [debt]);

  async function removeDebt() {
    if (!confirm("این طلب/بدهی حذف شود؟ تراکنش‌های مرتبط باقی می‌مانند.")) return;

    setDeleting(true);
    try {
      await debtsApi.deleteDebt(debtId);
      showToast("حذف شد", "success");
      router.push(PATHS.DEBTS);
    } catch (err) {
      showErrorToast(err, "خطا در حذف");
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !debt) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted">در حال بارگذاری…</div>
    );
  }

  const isReceivable = debt.type === DebtType.RECEIVABLE;
  const progress =
    debt.totalAmount > 0
      ? Math.min((settledAmount / debt.totalAmount) * 100, 100)
      : 0;

  return (
    <div className="space-y-5 pb-6">
      <section className="glass rounded-3xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                  isReceivable ? "bg-income-soft text-income" : "bg-expense-soft text-expense"
                }`}
              >
                {debtTypeLabel(debt.type)}
              </span>
              <span className="rounded-lg bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                {statusLabel(debt.status)}
              </span>
            </div>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold">
              <Profile2User size={24} className="text-muted" />
              {debt.person}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {formatJalaliDate(String(debt.year), String(debt.month), String(debt.day))}
            </p>
          </div>
          {isReceivable ? (
            <ArrowDown size={28} className="text-income" variant="Bold" />
          ) : (
            <ArrowUp size={28} className="text-expense" variant="Bold" />
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className="text-xs text-muted">مبلغ کل</p>
            <p className="mt-1 font-bold">{formatPrice(debt.totalAmount)}</p>
          </div>
          <div className="rounded-xl bg-income-soft/50 p-3">
            <p className="text-xs text-muted">تسویه‌شده</p>
            <p className="mt-1 font-bold text-income">{formatPrice(settledAmount)}</p>
          </div>
          <div className="rounded-xl bg-expense-soft/50 p-3">
            <p className="text-xs text-muted">باقی‌مانده</p>
            <p className="mt-1 font-bold text-expense">{formatPrice(debt.remainingAmount)}</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>پیشرفت تسویه</span>
            <span>{Math.round(progress)}٪</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className={`h-full rounded-full ${isReceivable ? "bg-income" : "bg-expense"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {debt.description ? (
          <p className="mt-4 text-sm leading-7 text-muted">{debt.description}</p>
        ) : null}

        {debt.status !== "settled" && (
          <Button className="mt-4 w-full" onPress={() => setSettleOpen(true)}>
            ثبت تسویه
          </Button>
        )}
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { id: "overview" as const, label: "تسویه‌ها" },
            { id: "transactions" as const, label: "تراکنش‌ها" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-3">
          {debt.settlements.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              هنوز تسویه‌ای ثبت نشده
            </div>
          ) : (
            debt.settlements.map((settlement) => {
              const budget =
                typeof settlement.budget === "object" ? settlement.budget : null;
              return (
                <article key={settlement._id ?? `${settlement.amount}-${settlement.settledAt}`} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">تسویه {formatPrice(settlement.amount)}</p>
                      {budget?.category && typeof budget.category === "object" ? (
                        <p className="mt-1 text-xs text-muted">{budget.category.title}</p>
                      ) : null}
                    </div>
                    {budget?._id ? (
                      <Link
                        href={PATHS.BUDGET(budget._id)}
                        className="text-sm font-medium text-accent"
                      >
                        مشاهده تراکنش
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}

          <section className="rounded-2xl border border-dashed border-danger/35 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">منطقه خطر</p>
            <p className="mt-1 text-xs leading-6 text-muted">
              با حذف، رکورد طلب/بدهی پاک می‌شود؛ تراکنش‌های مبدأ و تسویه در لیست تراکنش‌ها باقی
              می‌مانند.
            </p>
            <Button
              className="mt-3"
              variant="danger"
              onPress={() => void removeDebt()}
              isPending={deleting}
            >
              <Trash size={18} />
              حذف طلب/بدهی
            </Button>
          </section>
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {formatCount(budgets.length)} تراکنش مرتبط · تراکنش مبدأ و تسویه‌ها
          </p>
          {budgets.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              تراکنشی یافت نشد
            </div>
          ) : (
            budgets.map((budget) => (
              <BudgetRow
                key={budget._id}
                budget={budget}
                isSource={
                  typeof debt.sourceBudget === "object" &&
                  debt.sourceBudget?._id === budget._id
                }
              />
            ))
          )}
        </div>
      )}

      <DebtSettleModal
        debt={debt}
        open={settleOpen}
        onOpenChange={setSettleOpen}
        onSettled={() => {
          setSettleOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function BudgetRow({ budget, isSource }: { budget: IBudget; isSource?: boolean }) {
  const isIncome = budget.type === BudgetType.INCOME;
  const categoryTitle =
    typeof budget.category === "object" && budget.category ? budget.category.title : "";

  return (
    <Link
      href={PATHS.BUDGET(budget._id)}
      className="block glass rounded-2xl p-4 transition hover:border-accent/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{categoryTitle || "بدون دسته"}</p>
            {isSource ? (
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
                مبدأ
              </span>
            ) : null}
          </div>
          {budget.description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted">{budget.description}</p>
          ) : null}
        </div>
        <p className={`shrink-0 font-bold ${isIncome ? "text-income" : "text-expense"}`}>
          {formatPrice(budget.price)}
        </p>
      </div>
    </Link>
  );
}
