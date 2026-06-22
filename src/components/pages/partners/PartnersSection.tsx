"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Add, Copy, Messages2, Trash } from "iconsax-reactjs";

import * as partnersApi from "@/common/api/partners";
import type {
  IPartner,
  PartnerContextType,
  PartnerPermissionLevel,
} from "@/common/interfaces/partner.interface";
import { showToast } from "@/common/utils/toast";
import { AddPartnerModal } from "@/components/pages/partners/AddPartnerModal";
import { PartnerActivityPanel } from "@/components/pages/partners/PartnerActivityPanel";
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
  if (isAppUser) return "کاربر برنامه · تأیید‌شده";
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

export function PartnersSection({ contextType, contextId, readOnly = false }: PartnersSectionProps) {
  const [partners, setPartners] = useState<IPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list =
        contextType === "project"
          ? await partnersApi.fetchProjectPartners(contextId)
          : await partnersApi.fetchVenturePartners(contextId);
      setPartners(list);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری شرکا");
    } finally {
      setLoading(false);
    }
  }, [contextId, contextType]);

  useEffect(() => {
    void load();
  }, [load]);

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

  const totalShare = partners
    .filter((p) => p.status !== "declined")
    .reduce((sum, p) => sum + (p.sharePercent || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">شرکا</h2>
          <p className="mt-1 text-sm text-muted">
            برای حساب‌کتاب مشترک، شریک اضافه کنید — با شماره موبایل
          </p>
        </div>
        <Button size="sm" onPress={() => setAddOpen(true)} isDisabled={readOnly}>
          <Add size={16} />
          شریک جدید
        </Button>
      </div>

      <PartnerSettlementPanel
        contextType={contextType}
        contextId={contextId}
        isOwner={!readOnly}
      />

      <PartnerActivityPanel contextType={contextType} contextId={contextId} />

      {totalShare > 0 ? (
        <p className="text-xs text-muted">
          جمع سهم‌های ثبت‌شده: {totalShare}٪
          {totalShare > 100 ? " (بیش از ۱۰۰٪ — بررسی کنید)" : ""}
        </p>
      ) : null}

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-muted">
          در حال بارگذاری…
        </div>
      ) : partners.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted">هنوز شریکی ثبت نشده</p>
          <Button className="mt-4" variant="secondary" onPress={() => setAddOpen(true)} isDisabled={readOnly}>
            اولین شریک را اضافه کنید
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <article
              key={partner._id}
              className="glass space-y-3 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
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

              <div className="flex flex-wrap gap-2 text-xs text-muted">
                {partner.sharePercent > 0 ? (
                  <span className="rounded-lg bg-surface-secondary px-2 py-1">
                    سهم {partner.sharePercent}٪
                  </span>
                ) : null}
                {partner.isAppUser && partner.status === "active" ? (
                  <span className="rounded-lg bg-surface-secondary px-2 py-1">
                    {permissionLabel(partner.permissionLevel)}
                  </span>
                ) : null}
                {partner.telegramNotified ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-surface-secondary px-2 py-1">
                    <Messages2 size={14} />
                    تلگرام ارسال شد
                  </span>
                ) : null}
              </div>

              {partner.notes ? (
                <p className="text-sm leading-6 text-muted">{partner.notes}</p>
              ) : null}

              {!readOnly && partner.isAppUser && partner.status === "active" ? (
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
              ) : null}

              <div className="flex flex-wrap gap-2 border-t border-border/40 pt-3">
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
            </article>
          ))}
        </div>
      )}

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
