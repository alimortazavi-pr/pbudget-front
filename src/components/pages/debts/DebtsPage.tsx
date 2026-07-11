"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

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
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { DebtType } from "@/types/enums";

type FilterTab = "open" | "all" | "settled";

function debtTypeLabel(type: number, t: (key: string) => string) {
  return type === DebtType.RECEIVABLE
    ? t("pages.debts.typeReceivable")
    : t("pages.debts.typePayable");
}

function statusLabel(status: IDebt["status"], t: (key: string) => string) {
  if (status === "settled") return t("pages.debts.statusSettled");
  if (status === "partial") return t("pages.debts.statusPartial");
  return t("pages.debts.statusOpen");
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
      showToast(err instanceof Error ? err.message : t("pages.debts.loadError"));
    } finally {
      setLoading(false);
    }
  }, [tab, t]);

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
      <PageHeroSection
        variant="rose"
        eyebrow={t("pageHero.debts.eyebrow")}
        title={t("nav.debts")}
        description={t("pageHero.debts.description")}
      />

      {summary && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-income">
              <ArrowDown size={18} variant="Bold" />
              <span className="text-sm font-medium">{t("auto.k26835ea41b")}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatPrice(summary.openReceivable)}</p>
            <p className="mt-1 text-xs text-muted">
              {formatCount(summary.openReceivableCount)} {t("auto.k209d590f8f")}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-expense">
              <ArrowUp size={18} variant="Bold" />
              <span className="text-sm font-medium">{t("auto.k4b51a6b0f8")}</span>
            </div>
            <p className="mt-2 text-2xl font-bold">{formatPrice(summary.openPayable)}</p>
            <p className="mt-1 text-xs text-muted">
              {formatCount(summary.openPayableCount)} {t("auto.k0fd1994e7f")}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">{t("auto.k2bd34550a6")}</p>
        <Button size="sm" onPress={() => setCreateOpen(true)}>
          <Add size={18} />
          {t("pages.debts.newDebt")}
        </Button>
      </div>

      <div className="flex gap-2">
        {(
          [
            { id: "open" as const, label: t("pages.debts.filterOpen") },
            { id: "all" as const, label: t("pages.debts.filterAll") },
            { id: "settled" as const, label: t("pages.debts.filterSettled") },
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
        <div className="glass rounded-2xl p-10 text-center text-muted">{t("common.loading")}</div>
      ) : sortedDebts.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-muted">
          <p>{t("auto.k4db948a344")}</p>
          <p className="mt-2 text-sm leading-7">{t("pages.debts.emptyHint")}</p>
          <Button className="mt-4" onPress={() => setCreateOpen(true)}>
            <Add size={18} />
            {t("pages.debts.registerParty")}
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
                        {debtTypeLabel(debt.type, t)}
                      </span>
                      <span className="rounded-lg bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                        {statusLabel(debt.status, t)}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 font-semibold">
                      <Profile2User size={18} className="text-muted" />
                      {debt.person}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {formatJalaliDate(String(debt.year), String(debt.month), String(debt.day))}
                      {debt.settlements?.length
                        ? ` · ${formatCount(debt.settlements.length)} ${t("auto.k43ef5d91de")}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold">{formatPrice(debt.remainingAmount)}</p>
                    <p className="text-xs text-muted">{t("auto.k9aeccd708e")}{formatPrice(debt.totalAmount)}</p>
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
