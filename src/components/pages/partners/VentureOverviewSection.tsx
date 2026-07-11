"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import {
  ArrowLeft,
  Chart,
  People,
  Receipt,
  Wallet,
} from "iconsax-reactjs";

import * as partnersApi from "@/common/api/partners";
import { PATHS } from "@/common/constants";
import type { IPartner, IVenture } from "@/common/interfaces/partner.interface";
import { formatCount, formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormTextArea } from "@/components/common/form/FormFields";

type VentureOverviewSectionProps = {
  ventureId: string;
  venture: IVenture;
  partners: IPartner[];
  stats?: {
    receivedAmount: number;
    spentAmount: number;
    profitAmount: number;
    transactionCount: number;
  };
  readOnly?: boolean;
  onUpdated?: (venture: IVenture) => void;
  onNavigateTab?: (tab: "partners" | "transactions" | "board") => void;
};

export function VentureOverviewSection({
  ventureId,
  venture,
  partners,
  stats,
  readOnly = false,
  onUpdated,
  onNavigateTab,
}: VentureOverviewSectionProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState(venture.description ?? "");
  const [saving, setSaving] = useState(false);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [debtLoading, setDebtLoading] = useState(true);

  const activePartners = partners.filter((partner) => partner.status !== "declined");
  const totalShare = activePartners.reduce(
    (sum, partner) => sum + (partner.sharePercent || 0),
    0,
  );

  const loadDebtSummary = useCallback(async () => {
    if (activePartners.length === 0) {
      setTotalReceivable(0);
      setDebtLoading(false);
      return;
    }

    setDebtLoading(true);
    try {
      const data = await partnersApi.fetchPartnerDebtBalances("venture", ventureId);
      const receivable = data.partners.reduce(
        (sum, row) => sum + Math.max(row.netBalance, 0),
        0,
      );
      setTotalReceivable(receivable);
    } catch {
      setTotalReceivable(0);
    } finally {
      setDebtLoading(false);
    }
  }, [activePartners.length, ventureId]);

  useEffect(() => {
    void loadDebtSummary();
  }, [loadDebtSummary]);

  async function saveDescription() {
    setSaving(true);
    try {
      const updated = await partnersApi.updateVenture(ventureId, {
        description: description.trim(),
      });
      onUpdated?.(updated);
      showToast(t("auto.k34fc88b9d4"), "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k01981ce4e8"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-accent/8 via-background to-background p-5">
        <p className="text-sm text-muted">{t("auto.kb56cd3ac95")}</p>
        <h2 className="mt-1 text-2xl font-bold">{venture.title}</h2>
        {venture.description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            {venture.description}
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border/50 bg-background p-4">
          <div className="flex items-center gap-2 text-muted">
            <People size={18} />
            <span className="text-xs">{t("auto.kae6a285197")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{formatCount(activePartners.length)}</p>
          <p className="mt-1 text-xs text-muted">
            {t("pages.partners.totalShareLabel")} {t("pages.partners.totalSharePercent", { percent: totalShare })}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background p-4">
          <div className="flex items-center gap-2 text-muted">
            <Receipt size={18} />
            <span className="text-xs">{t("auto.k4ad10a7f11")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">
            {formatCount(stats?.transactionCount ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted">{t("auto.kfcddba4529")}</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background p-4">
          <div className="flex items-center gap-2 text-muted">
            <Chart size={18} />
            <span className="text-xs">{t("auto.k0df4572857")}</span>
          </div>
          <p
            className={`mt-2 text-2xl font-bold ${
              (stats?.profitAmount ?? 0) >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {formatPrice(stats?.profitAmount ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t("auto.k63397316b7")}{formatPrice(stats?.receivedAmount ?? 0)} · {t("common.expense")}{" "}
            {formatPrice(stats?.spentAmount ?? 0)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-background p-4">
          <div className="flex items-center gap-2 text-muted">
            <Wallet size={18} />
            <span className="text-xs">{t("auto.k51ae7de4a7")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-income">
            {debtLoading ? "…" : formatPrice(totalReceivable)}
          </p>
          <p className="mt-1 text-xs text-muted">{t("auto.kd60a8ece48")}</p>
        </div>
      </div>

      {!readOnly ? (
        <section className="rounded-2xl border border-border/50 bg-background p-4">
          <h3 className="font-bold">{t("auto.k1779754adc")}</h3>
          <p className="mt-1 text-xs text-muted">
            {t("auto.k02d0e2b846")}
          </p>
          <div className="mt-3 space-y-3">
            <FormTextArea
              label={t("common.description")}
              placeholder={t("auto.k7c1a76c981")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            <Button
              size="sm"
              onPress={() => void saveDescription()}
              isPending={saving}
            >
              {t("auto.keb4091ca3b")}
            </Button>
          </div>
        </section>
      ) : venture.description ? null : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
          {t("auto.k00edb7a027")}
        </p>
      )}

      {activePartners.length > 0 ? (
        <section className="rounded-2xl border border-border/50 bg-background p-4">
          <h3 className="font-bold">{t("auto.k59b0fbff9b")}</h3>
          <div className="mt-3 space-y-2">
            {activePartners.slice(0, 4).map((partner) => (
              <div
                key={partner._id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-secondary/60 px-3 py-2.5"
              >
                <div>
                  <p className="font-medium">{partner.displayName}</p>
                  <p className="text-xs text-muted">
                    {t("pages.partners.sharePercent", { percent: partner.sharePercent })}
                  </p>
                </div>
                <span className="rounded-lg bg-accent/10 px-2 py-1 text-xs text-accent">
                  {partner.status === "pending" ? t("auto.kdc55d0b549") : t("auto.k25c499f433")}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted">{t("auto.k59b990ce1d")}</p>
          <p className="mt-1 text-xs text-muted">
            {t("auto.k179457b82c")}
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => onNavigateTab?.("partners")}
        >
          <People size={16} />
          {t("auto.kd7638a798e")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => onNavigateTab?.("transactions")}
        >
          <Receipt size={16} />
          {t("auto.k4ad10a7f11")}
        </Button>
        <Link href={PATHS.DEBTS}>
          <Button size="sm" variant="secondary">
            <ArrowLeft size={16} />
            {t("nav.debts")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
