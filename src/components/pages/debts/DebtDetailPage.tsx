"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowDown, ArrowUp, Link1, Profile2User, Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as debtsApi from "@/common/api/debts";
import type { IDebt } from "@/common/interfaces/debt.interface";
import type { IBudget } from "@/common/interfaces/budget.interface";
import type { ICategory } from "@/common/interfaces/category.interface";
import { formatJalaliDate, formatPrice, formatCount } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AttachBudgetButton } from "@/components/common/budget/AttachBudgetModal";
import { SettlementProgressBar } from "@/components/common/ui/SettlementProgressBar";
import { DebtSettleModal } from "@/components/pages/debts/DebtSettleModal";
import { useAppSelector } from "@/stores/hooks";
import { categoriesSelector } from "@/stores/category";
import { BudgetType, DebtType } from "@/types/enums";

type DebtDetailPageProps = {
  debtId: string;
};

type TabId = "overview" | "transactions";

function debtTypeLabel(type: number) {
  return type === DebtType.RECEIVABLE ? t("auto.kf48e3aa79d") : t("auto.kebf7b80fd6");
}

function statusLabel(status: IDebt["status"]) {
  if (status === "settled") return t("debts.settled");
  if (status === "partial") return t("auto.ka9b46e77b6");
  return t("auto.k2e91d38fda");
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

function resolveBudgetTitle(budget: IBudget, categories: ICategory[]) {
  const category = budget.category as ICategory | string | null | undefined;
  if (category && typeof category === "object" && category.title) {
    return category.title;
  }
  if (typeof category === "string") {
    const match = categories.find((item) => item._id === category);
    if (match?.title) return match.title;
  }
  if (budget.description?.trim()) return budget.description.trim();
  return t("auto.kb5b0dc4c64");
}

export function DebtDetailPage({ debtId }: DebtDetailPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [debt, setDebt] = useState<IDebt | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [settleOpen, setSettleOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detachingId, setDetachingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await debtsApi.fetchDebt(debtId);
      setDebt(detail);
    } catch (err) {
      showErrorToast(err, t("auto.k0080763ff0"));
    } finally {
      setLoading(false);
    }
  }, [debtId]);

  useEffect(() => {
    void load();
  }, [load]);

  const budgets = useMemo(() => (debt ? extractBudgets(debt) : []), [debt]);

  const hasSourceBudget = useMemo(() => {
    if (!debt?.sourceBudget) return false;
    if (typeof debt.sourceBudget === "string") return Boolean(debt.sourceBudget);
    return Boolean(debt.sourceBudget._id);
  }, [debt]);

  const settledAmount = useMemo(() => {
    if (!debt) return 0;
    return debt.totalAmount - debt.remainingAmount;
  }, [debt]);

  async function removeDebt() {
    if (!confirm(t("auto.k558f268793"))) return;

    setDeleting(true);
    try {
      await debtsApi.deleteDebt(debtId);
      showToast(t("common.deleted"), "success");
      router.push(PATHS.DEBTS);
    } catch (err) {
      showErrorToast(err, t("auto.kcb7622491d"));
    } finally {
      setDeleting(false);
    }
  }

  async function detachSource() {
    if (!confirm(t("auto.k7f10976cd3"))) return;

    setDetachingId("source");
    try {
      await debtsApi.detachDebtSource(debtId);
      showToast(t("debts.sourceDetached"), "success");
      await load();
    } catch (err) {
      showErrorToast(err, t("auto.kb6e4d70efa"));
    } finally {
      setDetachingId(null);
    }
  }

  async function detachSettlement(budgetId: string) {
    if (!confirm(t("auto.kfd85e3f910"))) return;

    setDetachingId(budgetId);
    try {
      await debtsApi.removeDebtSettlement(debtId, budgetId);
      showToast(t("debts.settlementDetached"), "success");
      await load();
    } catch (err) {
      showErrorToast(err, t("auto.kb6e4d70efa"));
    } finally {
      setDetachingId(null);
    }
  }

  if (loading || !debt) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted">{t("common.loading")}</div>
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
            <p className="text-xs text-muted">{t("common.totalAmount")}</p>
            <p className="mt-1 font-bold">{formatPrice(debt.totalAmount)}</p>
          </div>
          <div className="rounded-xl bg-income-soft/50 p-3">
            <p className="text-xs text-muted">{t("debts.settled")}</p>
            <p className="mt-1 font-bold text-income">{formatPrice(settledAmount)}</p>
          </div>
          <div className="rounded-xl bg-expense-soft/50 p-3">
            <p className="text-xs text-muted">{t("debts.remaining")}</p>
            <p className="mt-1 font-bold text-expense">{formatPrice(debt.remainingAmount)}</p>
          </div>
        </div>

        <div className="mt-4">
          <SettlementProgressBar
            progress={progress}
            tone={isReceivable ? "receivable" : "payable"}
          />
        </div>

        {debt.description ? (
          <p className="mt-4 text-sm leading-7 text-muted">{debt.description}</p>
        ) : null}

        {debt.status !== "settled" && (
          <Button className="mt-4 w-full" onPress={() => setSettleOpen(true)}>
            {t("auto.k7931323bef")}
          </Button>
        )}
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            { id: "overview" as const, label: t("auto.kc41f1c27a6") },
            { id: "transactions" as const, label: t("auto.k4ad10a7f11") },
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
              {t("auto.k19a5163d67")}
            </div>
          ) : (
            debt.settlements.map((settlement) => {
              const budget =
                typeof settlement.budget === "object" ? settlement.budget : null;
              return (
                <article key={settlement._id ?? `${settlement.amount}-${settlement.settledAt}`} className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{t("auto.k43ef5d91de")}{formatPrice(settlement.amount)}</p>
                      {budget?.category && typeof budget.category === "object" ? (
                        <p className="mt-1 text-xs text-muted">{budget.category.title}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {budget?._id ? (
                        <Link
                          href={PATHS.BUDGET(budget._id)}
                          className="text-sm font-medium text-accent"
                        >
                          {t("auto.k26de34aef1")}
                        </Link>
                      ) : null}
                      {budget?._id ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => void detachSettlement(budget._id)}
                          isPending={detachingId === budget._id}
                          aria-label={t("debts.detachSettlement")}
                        >
                          <Link1 size={16} className="rotate-45" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}

          <section className="rounded-2xl border border-dashed border-danger/35 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">{t("common.dangerZone")}</p>
            <p className="mt-1 text-xs leading-6 text-muted">
              {t("auto.kf3da40a3df")}
              {t("auto.k349aa3999c")}
            </p>
            <Button
              className="mt-3"
              variant="danger"
              onPress={() => void removeDebt()}
              isPending={deleting}
            >
              <Trash size={18} />
              {t("auto.ked6c60e057")}
            </Button>
          </section>
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {formatCount(budgets.length)} {t("auto.kdb1b92d4fa")}
            </p>
            <div className="flex flex-wrap gap-2">
              {!hasSourceBudget && (
                <AttachBudgetButton
                  title={t("debts.attachSource")}
                  description={
                    isReceivable
                      ? t("auto.k0bf30dbd5b")
                      : t("auto.k6ee2483e9c")
                  }
                  context={{ type: "debt-source", contextId: debtId }}
                  selectionMode="single"
                  onAttach={async (budgetId) => {
                    await debtsApi.attachDebtSource(debtId, budgetId);
                    await load();
                  }}
                  attachLabel={t("auto.kb8b0ca1ea2")}
                />
              )}
              {debt.status !== "settled" && (
                <>
                  <AttachBudgetButton
                    title={t("debts.attachSettlement")}
                    description={
                      isReceivable
                        ? t("auto.k09057887d9")
                        : t("auto.kc88683808d")
                    }
                    context={{ type: "debt-settlement", contextId: debtId }}
                    selectionMode="multiple"
                    onAttach={async (budgetId) => {
                      await debtsApi.settleDebt(debtId, { budgetId });
                      await load();
                    }}
                    onAttachMultiple={async (budgetIds) => {
                      await debtsApi.settleDebtBulk(
                        debtId,
                        budgetIds.map((budgetId) => ({ budgetId })),
                      );
                      await load();
                    }}
                    attachLabel={t("auto.kb8b0ca1ea2")}
                  />
                  <Button size="sm" onPress={() => setSettleOpen(true)}>
                    {t("auto.k7931323bef")}
                  </Button>
                </>
              )}
            </div>
          </div>
          {budgets.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-muted">
              {t("auto.k22a5c47aec")}
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
                onDetach={
                  typeof debt.sourceBudget === "object" &&
                  debt.sourceBudget?._id === budget._id
                    ? () => void detachSource()
                    : debt.settlements.some(
                          (s) =>
                            (typeof s.budget === "object" ? s.budget?._id : s.budget) ===
                            budget._id,
                        )
                      ? () => void detachSettlement(budget._id)
                      : undefined
                }
                detaching={
                  detachingId === budget._id ||
                  (detachingId === "source" &&
                    typeof debt.sourceBudget === "object" &&
                    debt.sourceBudget?._id === budget._id)
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

function BudgetRow({
  budget,
  isSource,
  onDetach,
  detaching,
}: {
  budget: IBudget;
  isSource?: boolean;
  onDetach?: () => void;
  detaching?: boolean;
}) {
  const { t } = useTranslation();
  const categories = useAppSelector(categoriesSelector) ?? [];
  const isIncome = budget.type === BudgetType.INCOME;
  const title = resolveBudgetTitle(budget, categories);
  const showDescription = Boolean(
    budget.description?.trim() && budget.description.trim() !== title,
  );

  return (
    <div className="glass rounded-2xl p-4 transition hover:border-accent/40">
      <div className="flex items-center justify-between gap-3">
        <Link href={PATHS.BUDGET(budget._id)} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold">{title}</p>
            {isSource ? (
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] text-accent">
                {t("auto.k1afe0e0f5a")}
              </span>
            ) : (
              <span className="rounded-md bg-income-soft px-1.5 py-0.5 text-[10px] text-income">
                {t("auto.k43ef5d91de")}
              </span>
            )}
          </div>
          {showDescription ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted">{budget.description}</p>
          ) : null}
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <p className={`font-bold ${isIncome ? "text-income" : "text-expense"}`}>
            {formatPrice(budget.price)}
          </p>
          {onDetach ? (
            <Button
              size="sm"
              variant="ghost"
              onPress={onDetach}
              isPending={detaching}
              aria-label={t("common.disconnect")}
            >
              <Link1 size={16} className="rotate-45" />
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
