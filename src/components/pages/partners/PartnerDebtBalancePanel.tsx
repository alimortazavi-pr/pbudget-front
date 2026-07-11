"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

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
  if (parts.length === 0) return t("auto.kd14862b0be");
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

export function PartnerDebtBalancePanel({
  contextType,
  contextId,
  partners,
  ownerName: ownerNameProp,
}: PartnerDebtBalancePanelProps) {
  const { t } = useTranslation();
  const [ownerName, setOwnerName] = useState(ownerNameProp ?? t("auto.kd1a740d28c"));
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
      showToast(err instanceof Error ? err.message : t("auto.k0443b207c8"));
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
              <h3 className="text-base font-bold">{t("auto.kfd341aa317")}</h3>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                {t("auto.k4dfac6435f")}
              </p>
            </div>
          </div>
          {totalReceivable > 0 ? (
            <div className="rounded-xl bg-income-soft/70 px-3 py-2 text-left">
              <p className="text-[11px] text-muted">{t("auto.kf6c0c78993")}</p>
              <p className="font-bold text-income">{formatPrice(totalReceivable)}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("auto.kc2b3442473")}</p>
        ) : !hasTransactions ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            {t("auto.k05ad6be721")}{contextType === "project" ? t("auto.kcce7e8ff41") : t("auto.k9f48ae23bb")} {t("auto.k21c9b3c7c5")}.
            {t("auto.k7e4d424c0c")}
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
                          {t("pages.partners.sharePercent", { percent: partner.sharePercent })}
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
                            ? `${formatPrice(Math.abs(net))} ${t("auto.k7146b67cab")}`
                            : net > 0
                              ? `${formatPrice(net)} ${t("auto.k8c310e32b6")}`
                              : t("auto.k43ef5d91de")}
                        </div>
                      ) : (
                        <span className="rounded-xl bg-surface-secondary px-3 py-1.5 text-xs text-muted">
                          {t("auto.k0a647487b5")}
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
                                  {t("auto.k4a81d5ee37")}{relation.person}
                                </span>
                              </div>
                              <div className="text-left leading-5">
                                {relation.owesAmount > 0 ? (
                                  <p className="text-expense">
                                    {t("auto.k7146b67cab")}{formatPrice(relation.owesAmount)}
                                  </p>
                                ) : null}
                                {relation.owedAmount > 0 ? (
                                  <p className="text-income">
                                    {t("auto.k8c310e32b6")}{formatPrice(relation.owedAmount)}
                                  </p>
                                ) : null}
                                {relationNet < 0 ? (
                                  <p className="mt-0.5 font-semibold text-expense">
                                    {partner.displayName} {t("auto.k4086a71c68")}{" "}
                                    {formatPrice(Math.abs(relationNet))} {t("auto.ke51c5c37d1")}
                                  </p>
                                ) : relationNet > 0 ? (
                                  <p className="mt-0.5 font-semibold text-income">
                                    {relation.person} {t("auto.k4086a71c68")}{" "}
                                    {formatPrice(relationNet)} {t("auto.ke51c5c37d1")}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-muted">
                        {t("auto.k143d20b74b")}{ownerName}{" "}
                        {t("auto.kdc10173828")}
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
