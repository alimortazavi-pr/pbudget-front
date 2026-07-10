"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Add, ArrowDown, ArrowUp, Profile2User } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as debtsApi from "@/common/api/debts";
import type { IDebt, IDebtSummary } from "@/common/interfaces/debt.interface";
import { formatJalaliDate, formatPrice, formatCount } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { CreateDebtModal } from "@/components/pages/debts/CreateDebtModal";
import { SettlementProgressBar } from "@/components/common/ui/SettlementProgressBar";
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
  const { t } = useTranslation();
  const router = useRouter();
  const [summary, setSummary] = useState<IDebtSummary | null>(null);
  const [debts, setDebts] = useState<IDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("open");
  const [createOpen, setCreateOpen] = useState(false);

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
        <p className="text-sm font-medium text-white/80">{t("مدیریت تعهدات مالی")}</p>
        <h1 className="mt-1 text-2xl font-bold">{t("طلب و بدهی")}</h1>
        <p className="mt-2 text-sm leading-7 text-white/80">
          هر طلب یا بدهی را باز کنید؛ تسویه‌ها، تراکنش‌ها و تحلیل را در یک صفحه ببینید.
        </p>
      </section>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-income">
              <ArrowDown size={18} variant="Bold" />
              <span className="text-sm font-medium">{t("طلب باز")}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatPrice(summary.openReceivable)}</p>
            <p className="mt-1 text-xs text-muted">
              {formatCount(summary.openReceivableCount)} مورد · باید به شما پرداخت شود
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-expense">
              <ArrowUp size={18} variant="Bold" />
              <span className="text-sm font-medium">{t("بدهی باز")}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatPrice(summary.openPayable)}</p>
            <p className="mt-1 text-xs text-muted">
              {formatCount(summary.openPayableCount)} مورد · شما باید پرداخت کنید
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{t("فیلتر وضعیت")}</p>
        <Button size="sm" onPress={() => setCreateOpen(true)}>
          <Add size={18} />
          طلب/بدهی جدید
        </Button>
      </div>

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
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("در حال بارگذاری…")}</div>
      ) : sortedDebts.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          <p>{t("هنوز طلب یا بدهی ثبت نشده.")}</p>
          <p className="mt-2 text-sm leading-7">
            از دکمه «طلب/بدهی جدید» طرف حساب را اضافه کنید، یا هنگام ثبت تراکنش گزینه
            «مرتبط با طلب یا بدهی» را فعال کنید.
          </p>
          <Button className="mt-4" onPress={() => setCreateOpen(true)}>
            <Add size={18} />
            ثبت طرف حساب
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDebts.map((debt) => {
            const isReceivable = debt.type === DebtType.RECEIVABLE;
            const progress =
              debt.totalAmount > 0
                ? Math.min(
                    ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100,
                    100,
                  )
                : 0;

            return (
              <Link
                key={debt._id}
                href={PATHS.DEBT(debt._id)}
                className="block glass rounded-2xl p-4 transition hover:border-accent/40"
              >
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
                      {debt.settlements?.length
                        ? ` · ${formatCount(debt.settlements.length)} تسویه`
                        : ""}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold">{formatPrice(debt.remainingAmount)}</p>
                    <p className="text-xs text-muted">از {formatPrice(debt.totalAmount)}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <SettlementProgressBar
                    progress={progress}
                    tone={isReceivable ? "receivable" : "payable"}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <CreateDebtModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(debtId) => router.push(PATHS.DEBT(debtId))}
      />
    </div>
  );
}
