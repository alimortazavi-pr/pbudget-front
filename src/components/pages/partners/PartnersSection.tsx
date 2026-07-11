"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import {
  Add,
  Copy,
  Messages2,
  People,
  Trash,
} from "iconsax-reactjs";

import * as partnersApi from "@/common/api/partners";
import type {
  IPartner,
  IPartnerDebtBalance,
  PartnerContextType,
  PartnerPermissionLevel,
} from "@/common/interfaces/partner.interface";
import { formatPrice } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { AddPartnerModal } from "@/components/pages/partners/AddPartnerModal";
import { PartnerActivityPanel } from "@/components/pages/partners/PartnerActivityPanel";
import { PartnerDebtBalancePanel } from "@/components/pages/partners/PartnerDebtBalancePanel";
import { PartnerSettlementPanel } from "@/components/pages/partners/PartnerSettlementPanel";
import { FormSelect } from "@/components/common/form/FormFields";

type PartnersSectionProps = {
  contextType: PartnerContextType;
  contextId: string;
  readOnly?: boolean;
};

function statusLabel(status: IPartner["status"], isAppUser: boolean) {
  if (status === "pending") return t("auto.k7474af631f");
  if (status === "declined") return t("auto.kb653000a56");
  if (isAppUser) return t("auto.kf016943a8b");
  return t("auto.k8ad638a1b0");
}

function statusClass(status: IPartner["status"]) {
  if (status === "pending") return "bg-warning/15 text-warning-foreground";
  if (status === "declined") return "bg-danger/15 text-danger";
  return "bg-success/15 text-success-foreground";
}

function permissionLabel(level?: PartnerPermissionLevel) {
  if (level === "owner") return t("auto.kd1a740d28c");
  if (level === "editor") return t("auto.kb0022d87ad");
  return t("auto.k53404e4309");
}

function isOwnerPartner(partner: IPartner) {
  return partner.isOwner === true || partner.permissionLevel === "owner";
}

function partnerInitials(name: string) {

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return t("auto.kd14862b0be");
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

export function PartnersSection({ contextType, contextId, readOnly = false }: PartnersSectionProps) {
  const { t } = useTranslation();
  const [partners, setPartners] = useState<IPartner[]>([]);
  const [debtBalances, setDebtBalances] = useState<IPartnerDebtBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showActivity, setShowActivity] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list =
        contextType === "project"
          ? await partnersApi.fetchProjectPartners(contextId)
          : await partnersApi.fetchVenturePartners(contextId);
      setPartners(list);

      const active = list.filter((partner) => partner.status !== "declined");
      if (active.length > 0) {
        const balances = await partnersApi.fetchPartnerDebtBalances(
          contextType,
          contextId,
        );
        setDebtBalances(balances.partners);
      } else {
        setDebtBalances([]);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k9e4fe8f578"));
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  useEffect(() => {
    void load();
  }, [load]);

  const activePartners = useMemo(
    () => partners.filter((partner) => partner.status !== "declined"),
    [partners],
  );

  const totalShare = activePartners.reduce(
    (sum, partner) => sum + (partner.sharePercent || 0),
    0,
  );

  const totalReceivable = debtBalances.reduce(
    (sum, row) => sum + Math.max(row.netBalance, 0),
    0,
  );

  function debtBadge(partnerId: string) {
    const row = debtBalances.find((balance) => balance.partnerId === partnerId);
    if (!row || row.netBalance === 0) {
      return null;
    }

    if (row.netBalance < 0) {
      return (
        <span className="rounded-lg bg-expense-soft px-2 py-1 text-xs font-semibold text-expense">
          {formatPrice(Math.abs(row.netBalance))} {t("auto.k7146b67cab")}
        </span>
      );
    }

    return (
      <span className="rounded-lg bg-income-soft px-2 py-1 text-xs font-semibold text-income">
        {formatPrice(row.netBalance)} {t("auto.k8c310e32b6")}
      </span>
    );
  }

  async function removePartner(partner: IPartner) {
    if (!confirm(t("pages.partners.deleteConfirm", { name: partner.displayName }))) return;
    try {
      await partnersApi.deletePartner(partner._id);
      showToast(t("auto.k4c8fce4807"), "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.kcb7622491d"));
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      showToast(t("auto.k16d6c6a3bd"), "success");
    } catch {
      showToast(t("auto.kfc3060ba28"));
    }
  }

  async function resendInvite(partnerId: string) {
    setResendingId(partnerId);
    try {
      const result = await partnersApi.resendPartnerInvite(partnerId);
      if (result.telegramSent) {
        showToast(t("auto.kba607ed720"), "success");
      } else {
        showToast(t("auto.kcfc67711f5"), "success");
      }
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k4508c413b1"));
    } finally {
      setResendingId(null);
    }
  }

  async function changePermission(partner: IPartner, permissionLevel: PartnerPermissionLevel) {
    if (permissionLevel === "owner") return;
    setUpdatingId(partner._id);
    try {
      await partnersApi.updatePartner(partner._id, { permissionLevel });
      showToast(t("auto.kc1d6100623"), "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.ke9863812ee"));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("auto.kd7638a798e")}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("auto.k88043c2b0b")}
          </p>
        </div>
        <Button onPress={() => setAddOpen(true)} isDisabled={readOnly}>
          <Add size={16} />
          {t("auto.k9451f46bb3")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
          <div className="flex items-center gap-2 text-muted">
            <People size={16} />
            <span className="text-xs">{t("auto.k6318a8f803")}</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{activePartners.length}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
          <p className="text-xs text-muted">{t("auto.kbba92c3e90")}</p>
          <p className="mt-2 text-2xl font-bold">
            {t("pages.partners.totalSharePercent", { percent: totalShare })}
          </p>
          {totalShare > 100 ? (
            <p className="mt-1 text-xs text-danger">{t("auto.kd3faa370d8")}</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
          <p className="text-xs text-muted">{t("auto.ke86e903b71")}</p>
          <p className="mt-2 text-2xl font-bold text-income">
            {formatPrice(totalReceivable)}
          </p>
        </div>
      </div>

      <PartnerDebtBalancePanel
        contextType={contextType}
        contextId={contextId}
        partners={partners}
      />

      <PartnerSettlementPanel
        contextType={contextType}
        contextId={contextId}
        isOwner={!readOnly}
        onSettlementApplied={() => void load()}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">{t("auto.k4ded8be32e")}</h3>
          <span className="text-xs text-muted">
            {activePartners.length} {t("auto.k957ae7e66d")}
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/50 p-8 text-center text-muted">
            {t("common.loading")}
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted">{t("auto.k18b659c8d3")}</p>
            <Button
              className="mt-4"
              variant="secondary"
              onPress={() => setAddOpen(true)}
              isDisabled={readOnly}
            >
              {t("auto.k36329a14ca")}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {partners.map((partner) => {
              const ownerEntry = isOwnerPartner(partner);
              return (
              <article
                key={partner._id}
                className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-base font-bold text-accent">
                    {partnerInitials(partner.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-bold">{partner.displayName}</p>
                        <p className="mt-0.5 text-sm text-muted" dir="ltr">
                          {partner.mobile}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-1 text-xs font-medium ${statusClass(partner.status)}`}
                      >
                        {statusLabel(partner.status, partner.isAppUser)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {partner.sharePercent > 0 ? (
                        <span className="rounded-lg bg-surface-secondary px-2 py-1 text-xs">
                          {t("pages.partners.sharePercent", { percent: partner.sharePercent })}
                        </span>
                      ) : null}
                      {partner.isAppUser && partner.status === "active" ? (
                        <span className="rounded-lg bg-surface-secondary px-2 py-1 text-xs">
                          {permissionLabel(partner.permissionLevel)}
                        </span>
                      ) : null}
                      {debtBadge(partner._id)}
                      {partner.telegramNotified ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary px-2 py-1 text-xs">
                          <Messages2 size={14} />
                          {t("auto.kca3d2562e4")}
                        </span>
                      ) : null}
                    </div>

                    {partner.notes ? (
                      <p className="mt-3 text-sm leading-6 text-muted">{partner.notes}</p>
                    ) : null}

                    {!readOnly && partner.isAppUser && partner.status === "active" && !ownerEntry ? (
                      <div className="mt-3">
                        <FormSelect
                          label={t("auto.kf3b9549a2b")}
                          selectedKey={partner.permissionLevel ?? "viewer"}
                          onSelectionChange={(key) =>
                            void changePermission(partner, key as PartnerPermissionLevel)
                          }
                          isDisabled={updatingId === partner._id}
                          options={[
                            { id: "viewer", label: t("auto.k53404e4309") },
                            { id: "editor", label: t("auto.kb0022d87ad") },
                          ]}
                        />
                      </div>
                    ) : null}

                    {partner.inviteLink && partner.status === "pending" ? (
                      <div className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs">
                        <p className="font-medium text-warning-foreground">{t("auto.kd80e925e12")}</p>
                        <p className="mt-1 break-all text-foreground">{partner.inviteLink}</p>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-border/40 pt-3">
                      {partner.inviteLink && partner.status === "pending" && !readOnly ? (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => void copyLink(partner.inviteLink!)}
                          >
                            <Copy size={14} />
                            {t("auto.kac0faf914a")}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            isPending={resendingId === partner._id}
                            onPress={() => void resendInvite(partner._id)}
                          >
                            {t("auto.k9330713652")}
                          </Button>
                        </>
                      ) : null}
                      {!readOnly && !ownerEntry ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onPress={() => void removePartner(partner)}
                        >
                          <Trash size={14} />
                          {t("common.delete")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/50 bg-background">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setShowActivity((value) => !value)}
        >
          {t("auto.k789357d8e6")}
          <span className="text-xs text-muted">{showActivity ? t("common.close") : t("auto.kcf5a6721b9")}</span>
        </button>
        {showActivity ? (
          <div className="border-t border-border/40 px-4 pb-4">
            <PartnerActivityPanel contextType={contextType} contextId={contextId} />
          </div>
        ) : null}
      </section>

      {!readOnly ? (
        <AddPartnerModal
          open={addOpen}
          onOpenChange={setAddOpen}
          contextType={contextType}
          contextId={contextId}
          onCreated={() => void load()}
        />
      ) : null}
    </div>
  );
}
