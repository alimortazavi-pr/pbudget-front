"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowDown, ArrowUp, Profile2User } from "iconsax-reactjs";

import * as debtsApi from "@/common/api/debts";
import type { IDebt, IDebtSummary } from "@/common/interfaces/debt.interface";
import { formatJalaliDate, formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { DebtSettleModal } from "@/components/pages/debts/DebtSettleModal";
import { DebtType } from "@/types/enums";

type FilterTab = "open" | "all" | "settled";

function debtTypeLabel(type: number) {
  return type === DebtType.RECEIVABLE ? "طلب" : "بدهی";
}

function statusLabel(status: IDebt["status"]) {
  if (status === "settled") return "تسویه‌شده";
  if (status === "partial") return "تسویه جزئی";
  return "باز";
}

export function DebtsPage() {
  const [summary, setSummary] = useState<IDebtSummary | null>(null);
  const [debts, setDebts] = useState<IDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("open");
  const [settleTarget, setSettleTarget] = useState<IDebt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, debtsRes] = await Promise.all([
        debtsApi.fetchDebtSummary(),
        debtsApi.fetchDebts({
          status: tab === "open" ? "open" : tab === "settled" ? "settled" : "all",
        }),
      ]);
      setSummary(summaryRes);
      const list =
        tab === "open"
          ? debtsRes.debts.filter((debt) => debt.status !== "settled")
          : tab === "settled"
            ? debtsRes.debts.filter((debt) => debt.status === "settled")
            : debtsRes.debts;
      setDebts(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedDebts = useMemo(
    () =>
      [...debts].sort((a, b) => {
        if (a.status === b.status) {
          return b.remainingAmount - a.remainingAmount;
        }
        return a.status === "settled" ? 1 : -1;
      }),
    [debts],
  );

  return (
    <div className="space-y-5 pb-6">
      <section className="rounded-3xl bg-gradient-to-br from-rose-500 to-rose-600 p-5 text-white shadow-lg">
        <p className="text-sm font-medium text-white/80">مدیریت تعهدات مالی</p>
        <h1 className="mt-1 text-2xl font-bold">طلب و بدهی</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          تراکنش پرداختی را به عنوان بدهی/طلب علامت بزنید و بعداً با تراکنش واقعی
          تسویه کنید.
        </p>
      </section>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-income">
              <ArrowDown size={18} variant="Bold" />
              <span className="text-sm font-medium">طلب باز</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatPrice(summary.openReceivable)}</p>
            <p className="mt-1 text-xs text-muted">
              {summary.openReceivableCount} مورد · باید به شما پرداخت شود
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-expense">
              <ArrowUp size={18} variant="Bold" />
              <span className="text-sm font-medium">بدهی باز</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatPrice(summary.openPayable)}</p>
            <p className="mt-1 text-xs text-muted">
              {summary.openPayableCount} مورد · شما باید پرداخت کنید
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(
          [
            { id: "open" as const, label: "باز" },
            { id: "all" as const, label: "همه" },
            { id: "settled" as const, label: "تسویه‌شده" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">در حال بارگذاری…</div>
      ) : sortedDebts.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          موردی برای نمایش نیست. هنگام ثبت تراکنش پرداختی، گزینه طلب/بدهی را فعال کنید.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDebts.map((debt) => {
            const isReceivable = debt.type === DebtType.RECEIVABLE;
            const progress =
              debt.totalAmount > 0
                ? ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100
                : 0;

            return (
              <article key={debt._id} className="glass rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                          isReceivable
                            ? "bg-income-soft text-income"
                            : "bg-expense-soft text-expense"
                        }`}
                      >
                        {debtTypeLabel(debt.type)}
                      </span>
                      <span className="rounded-lg bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                        {statusLabel(debt.status)}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 font-semibold">
                      <Profile2User size={18} className="text-muted" />
                      {debt.person}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatJalaliDate(String(debt.year), String(debt.month), String(debt.day))}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold">{formatPrice(debt.remainingAmount)}</p>
                    <p className="text-xs text-muted">از {formatPrice(debt.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary">
                  <div
                    className={`h-full rounded-full ${isReceivable ? "bg-income" : "bg-expense"}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                {debt.settlements?.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-border/40 pt-3 text-xs text-muted">
                    {debt.settlements.map((settlement) => {
                      const budget =
                        typeof settlement.budget === "object" ? settlement.budget : null;
                      return (
                        <p key={settlement._id ?? `${debt._id}-${settlement.amount}`}>
                          تسویه {formatPrice(settlement.amount)}
                          {budget?.category?.title ? ` · ${budget.category.title}` : ""}
                        </p>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {debt.status !== "settled" && (
                    <Button size="sm" variant="primary" onPress={() => setSettleTarget(debt)}>
                      تسویه
                    </Button>
                  )}
                  {typeof debt.sourceBudget === "object" && debt.sourceBudget?._id && (
                    <Link
                      href={`/budgets/${debt.sourceBudget._id}`}
                      className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10"
                    >
                      تراکنش مبدأ
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <DebtSettleModal
        debt={settleTarget}
        open={Boolean(settleTarget)}
        onOpenChange={(open) => {
          if (!open) setSettleTarget(null);
        }}
        onSettled={() => {
          setSettleTarget(null);
          void load();
        }}
      />
    </div>
  );
}
