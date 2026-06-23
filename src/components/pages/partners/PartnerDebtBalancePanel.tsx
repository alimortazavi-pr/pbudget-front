"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, ArrowDown, ArrowUp } from "iconsax-reactjs";

import * as partnersApi from "@/common/api/partners";
import type {
  IPartner,
  IPartnerDebtBalance,
  PartnerContextType,
} from "@/common/interfaces/partner.interface";
import { formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

type PartnerDebtBalancePanelProps = {
  contextType: PartnerContextType;
  contextId: string;
  partners: IPartner[];
  ownerName?: string;
};

function balanceForPartner(
  balances: IPartnerDebtBalance[],
  partnerId: string,
) {
  return balances.find((row) => row.partnerId === partnerId);
}

function partnerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

export function PartnerDebtBalancePanel({
  contextType,
  contextId,
  partners,
  ownerName: ownerNameProp,
}: PartnerDebtBalancePanelProps) {
  const [ownerName, setOwnerName] = useState(ownerNameProp ?? "مالک");
  const [balances, setBalances] = useState<IPartnerDebtBalance[]>([]);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [loading, setLoading] = useState(true);

  const activePartners = useMemo(
    () => partners.filter((partner) => partner.status !== "declined"),
    [partners],
  );

  const load = useCallback(async () => {
    if (activePartners.length === 0) {
      setBalances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await partnersApi.fetchPartnerDebtBalances(
        contextType,
        contextId,
      );
      setOwnerName(data.ownerName);
      setBalances(data.partners);
      setHasTransactions(data.hasTransactions === true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری حساب شرکا");
    } finally {
      setLoading(false);
    }
  }, [activePartners.length, contextId, contextType]);

  useEffect(() => {
    void load();
  }, [load]);

  if (activePartners.length === 0) {
    return null;
  }

  const totalReceivable = balances.reduce(
    (sum, row) => sum + Math.max(row.netBalance, 0),
    0,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-surface-secondary/60">
      <div className="border-b border-border/50 bg-accent/5 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold">حساب دفتری شرکا</h3>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                بر اساس تراکنش‌های واقعی — چه کسی پرداخت کرده و سهم هر شریک چقدر است
              </p>
            </div>
          </div>
          {totalReceivable > 0 ? (
            <div className="rounded-xl bg-income-soft/70 px-3 py-2 text-left">
              <p className="text-[11px] text-muted">مجموع طلب شما</p>
              <p className="font-bold text-income">{formatPrice(totalReceivable)}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-muted">در حال محاسبه حساب‌ها…</p>
        ) : !hasTransactions ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            هنوز تراکنشی به این {contextType === "project" ? "پروژه" : "کسب‌وکار"} وصل نشده.
            پس از ثبت تراکنش، بدهی و طلب هر شریک اینجا نمایش داده می‌شود.
          </p>
        ) : (
          activePartners.map((partner) => {
            const row = balanceForPartner(balances, partner._id);
            const owes = row?.owesAmount ?? 0;
            const owed = row?.owedAmount ?? 0;
            const net = row?.netBalance ?? 0;
            const hasBalance = owes > 0 || owed > 0;

            return (
              <article
                key={partner._id}
                className="rounded-2xl border border-border/50 bg-background/80 p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                    {partnerInitials(partner.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{partner.displayName}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          سهم {partner.sharePercent}٪
                        </p>
                      </div>
                      {hasBalance ? (
                        <div
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                            net < 0
                              ? "bg-expense-soft text-expense"
                              : net > 0
                                ? "bg-income-soft text-income"
                                : "bg-surface-secondary text-muted"
                          }`}
                        >
                          {net < 0
                            ? `${formatPrice(Math.abs(net))} بدهکار`
                            : net > 0
                              ? `${formatPrice(net)} طلبکار`
                              : "تسویه"}
                        </div>
                      ) : (
                        <span className="rounded-xl bg-surface-secondary px-3 py-1.5 text-xs text-muted">
                          بدون مانده
                        </span>
                      )}
                    </div>

                    {hasBalance ? (
                      <div className="mt-3 space-y-2">
                        {(row?.relations ?? []).map((relation) => {
                          const relationNet =
                            relation.owedAmount - relation.owesAmount;

                          return (
                            <div
                              key={`${partner._id}-${relation.person}`}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-secondary/70 px-3 py-2.5 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                {relationNet < 0 ? (
                                  <ArrowDown size={14} className="text-expense" />
                                ) : relationNet > 0 ? (
                                  <ArrowUp size={14} className="text-income" />
                                ) : null}
                                <span className="font-medium text-foreground">
                                  نسبت به {relation.person}
                                </span>
                              </div>
                              <div className="text-left leading-5">
                                {relation.owesAmount > 0 ? (
                                  <p className="text-expense">
                                    بدهکار {formatPrice(relation.owesAmount)}
                                  </p>
                                ) : null}
                                {relation.owedAmount > 0 ? (
                                  <p className="text-income">
                                    طلبکار {formatPrice(relation.owedAmount)}
                                  </p>
                                ) : null}
                                {relationNet < 0 ? (
                                  <p className="mt-0.5 font-semibold text-expense">
                                    {partner.displayName} باید{" "}
                                    {formatPrice(Math.abs(relationNet))} بپردازد
                                  </p>
                                ) : relationNet > 0 ? (
                                  <p className="mt-0.5 font-semibold text-income">
                                    {relation.person} باید{" "}
                                    {formatPrice(relationNet)} بپردازد
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">
                        با تراکنش‌های فعلی، مانده‌ای بین این شریک و {ownerName}{" "}
                        ثبت نشده
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
