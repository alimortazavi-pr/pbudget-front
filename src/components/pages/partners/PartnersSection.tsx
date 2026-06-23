"use client";

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
  if (status === "pending") return "در انتظار تأیید";
  if (status === "declined") return "رد شده";
  if (isAppUser) return "تأیید‌شده";
  return "مخاطب خارجی";
}

function statusClass(status: IPartner["status"]) {
  if (status === "pending") return "bg-warning/15 text-warning-foreground";
  if (status === "declined") return "bg-danger/15 text-danger";
  return "bg-success/15 text-success-foreground";
}

function permissionLabel(level?: PartnerPermissionLevel) {
  if (level === "editor") return "ویرایشگر";
  return "مشاهده";
}

function partnerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`;
}

export function PartnersSection({ contextType, contextId, readOnly = false }: PartnersSectionProps) {
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
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری شرکا");
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
          {formatPrice(Math.abs(row.netBalance))} بدهکار
        </span>
      );
    }

    return (
      <span className="rounded-lg bg-income-soft px-2 py-1 text-xs font-semibold text-income">
        {formatPrice(row.netBalance)} طلبکار
      </span>
    );
  }

  async function removePartner(partner: IPartner) {
    if (!confirm(`شریک «${partner.displayName}» حذف شود؟`)) return;
    try {
      await partnersApi.deletePartner(partner._id);
      showToast("شریک حذف شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در حذف");
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      showToast("لینک کپی شد", "success");
    } catch {
      showToast("کپی لینک ممکن نشد");
    }
  }

  async function resendInvite(partnerId: string) {
    setResendingId(partnerId);
    try {
      const result = await partnersApi.resendPartnerInvite(partnerId);
      if (result.telegramSent) {
        showToast("دعوت مجدد ارسال شد (تلگرام + لینک)", "success");
      } else {
        showToast("لینک جدید ساخته شد — تلگرام فعال نبود", "success");
      }
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ارسال مجدد");
    } finally {
      setResendingId(null);
    }
  }

  async function changePermission(partner: IPartner, permissionLevel: PartnerPermissionLevel) {
    if (permissionLevel === "owner") return;
    setUpdatingId(partner._id);
    try {
      await partnersApi.updatePartner(partner._id, { permissionLevel });
      showToast("دسترسی به‌روز شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در به‌روزرسانی");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">مدیریت شرکا</h2>
          <p className="mt-1 text-sm text-muted">
            دعوت، تقسیم سهم، حساب دفتری و دسترسی مشترک
          </p>
        </div>
        <Button onPress={() => setAddOpen(true)} isDisabled={readOnly}>
          <Add size={16} />
          شریک جدید
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
          <div className="flex items-center gap-2 text-muted">
            <People size={16} />
            <span className="text-xs">تعداد شرکا</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{activePartners.length}</p>
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
          <p className="text-xs text-muted">جمع سهم‌ها</p>
          <p className="mt-2 text-2xl font-bold">{totalShare}٪</p>
          {totalShare > 100 ? (
            <p className="mt-1 text-xs text-danger">بیش از ۱۰۰٪</p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-border/50 bg-surface-secondary/40 p-4">
          <p className="text-xs text-muted">طلب شما</p>
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
          <h3 className="font-bold">لیست شرکا</h3>
          <span className="text-xs text-muted">
            {activePartners.length} شریک فعال
          </span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/50 p-8 text-center text-muted">
            در حال بارگذاری…
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-muted">هنوز شریکی ثبت نشده</p>
            <Button
              className="mt-4"
              variant="secondary"
              onPress={() => setAddOpen(true)}
              isDisabled={readOnly}
            >
              اولین شریک را اضافه کنید
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {partners.map((partner) => (
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
                          سهم {partner.sharePercent}٪
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
                          تلگرام
                        </span>
                      ) : null}
                    </div>

                    {partner.notes ? (
                      <p className="mt-3 text-sm leading-6 text-muted">{partner.notes}</p>
                    ) : null}

                    {!readOnly && partner.isAppUser && partner.status === "active" ? (
                      <div className="mt-3">
                        <FormSelect
                          label="سطح دسترسی"
                          selectedKey={partner.permissionLevel ?? "viewer"}
                          onSelectionChange={(key) =>
                            void changePermission(partner, key as PartnerPermissionLevel)
                          }
                          isDisabled={updatingId === partner._id}
                          options={[
                            { id: "viewer", label: "مشاهده" },
                            { id: "editor", label: "ویرایشگر" },
                          ]}
                        />
                      </div>
                    ) : null}

                    {partner.inviteLink && partner.status === "pending" ? (
                      <div className="mt-3 rounded-xl bg-warning/10 px-3 py-2 text-xs">
                        <p className="font-medium text-warning-foreground">لینک دعوت</p>
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
                            کپی لینک
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            isPending={resendingId === partner._id}
                            onPress={() => void resendInvite(partner._id)}
                          >
                            ارسال مجدد
                          </Button>
                        </>
                      ) : null}
                      {!readOnly ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onPress={() => void removePartner(partner)}
                        >
                          <Trash size={14} />
                          حذف
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border/50 bg-background">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
          onClick={() => setShowActivity((value) => !value)}
        >
          تاریخچه همکاری
          <span className="text-xs text-muted">{showActivity ? "بستن" : "نمایش"}</span>
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
