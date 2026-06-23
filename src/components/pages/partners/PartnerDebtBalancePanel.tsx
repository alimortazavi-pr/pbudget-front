"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet } from "iconsax-reactjs";

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
};

function balanceForPartner(
  balances: IPartnerDebtBalance[],
  partnerId: string,
) {
  return balances.find((row) => row.partnerId === partnerId);
}

export function PartnerDebtBalancePanel({
  contextType,
  contextId,
  partners,
}: PartnerDebtBalancePanelProps) {
  const [ownerName, setOwnerName] = useState("مالک");
  const [balances, setBalances] = useState<IPartnerDebtBalance[]>([]);
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

  return (
    <section className="space-y-3 rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
      <div className="flex items-center gap-2">
        <Wallet size={18} className="text-accent" />
        <div>
          <h3 className="font-bold">حساب با اشخاص</h3>
          <p className="text-xs text-muted">
            بدهی و طلب هر شریک نسبت به {ownerName} و سایر اشخاص ثبت‌شده
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted">در حال بارگذاری حساب‌ها…</p>
      ) : (
        <div className="space-y-3">
          {activePartners.map((partner) => {
            const row = balanceForPartner(balances, partner._id);
            const owes = row?.owesAmount ?? 0;
            const owed = row?.owedAmount ?? 0;
            const hasBalance = owes > 0 || owed > 0;

            return (
              <article
                key={partner._id}
                className="rounded-xl bg-background/60 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold">{partner.displayName}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-lg px-2 py-1 font-medium ${
                        owes > 0
                          ? "bg-expense-soft text-expense"
                          : "bg-surface-secondary text-muted"
                      }`}
                    >
                      بدهکار: {formatPrice(owes)}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-1 font-medium ${
                        owed > 0
                          ? "bg-income-soft text-income"
                          : "bg-surface-secondary text-muted"
                      }`}
                    >
                      طلبکار: {formatPrice(owed)}
                    </span>
                  </div>
                </div>

                {!hasBalance ? (
                  <p className="mt-2 text-xs text-muted">
                    حساب باز با اشخاص دیگر ثبت نشده
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-xs text-muted">
                    {(row?.relations ?? []).map((relation) => (
                      <li
                        key={`${partner._id}-${relation.person}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-secondary/80 px-2 py-1.5"
                      >
                        <span className="font-medium text-foreground">
                          {relation.person}
                        </span>
                        <span className="flex flex-wrap gap-2">
                          {relation.owesAmount > 0 ? (
                            <span className="text-expense">
                              بدهکار {formatPrice(relation.owesAmount)}
                            </span>
                          ) : null}
                          {relation.owedAmount > 0 ? (
                            <span className="text-income">
                              طلبکار {formatPrice(relation.owedAmount)}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
