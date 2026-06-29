"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { Add, Trash } from "iconsax-reactjs";

import * as businessApi from "@/common/api/business";
import type {
  BusinessRolePreset,
  IBusinessStaffMember,
  IShiftTemplate,
} from "@/common/interfaces/business.interface";
import { showToast } from "@/common/utils/toast";
import { FormInput } from "@/components/common/form/FormFields";
import {
  AppModal,
  AppModalDialog,
  AppModalHeader,
} from "@/components/common/ui/AppModal";
import {
  hasBusinessPermission,
  workspaceContextSelector,
} from "@/stores/businessContext";
import { useAppSelector } from "@/stores/hooks";

const PRESET_OPTIONS: { value: BusinessRolePreset; label: string }[] = [
  { value: "admin", label: "مدیر" },
  { value: "accountant", label: "حسابدار" },
  { value: "cashier", label: "صندوقدار" },
  { value: "attendance_clerk", label: "مسئول حضور" },
  { value: "attendance_only", label: "فقط حضور" },
  { value: "viewer", label: "مشاهده" },
];

type BusinessStaffPageProps = {
  businessId: string;
};

export function BusinessStaffPage({ businessId }: BusinessStaffPageProps) {
  const workspace = useAppSelector(workspaceContextSelector);
  const permissions = workspace?.permissions ?? [];
  const canInvite = hasBusinessPermission(permissions, "staff.invite");
  const canRemove = hasBusinessPermission(permissions, "staff.remove");
  const canManageShifts = hasBusinessPermission(
    permissions,
    "attendance.manage_shifts",
  );

  const [staff, setStaff] = useState<IBusinessStaffMember[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<IShiftTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [mobile, setMobile] = useState("");
  const [preset, setPreset] = useState<BusinessRolePreset>("viewer");
  const [saving, setSaving] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await businessApi.fetchBusinessStaff(businessId);
      setStaff(data.staff);
      if (canManageShifts) {
        const templates =
          await businessApi.fetchBusinessShiftTemplates(businessId);
        setShiftTemplates(templates);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setLoading(false);
    }
  }, [businessId, canManageShifts]);

  async function assignShift(memberId: string, shiftTemplateId: string) {
    try {
      await businessApi.updateMemberAttendanceProfile(
        memberId,
        { shiftTemplateId: shiftTemplateId || null },
        businessId,
      );
      showToast("شیفت پرسنل به‌روز شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  async function lookupMobile() {
    if (!mobile.trim()) return;
    try {
      const res = await businessApi.lookupStaffMobile(mobile.trim());
      if (res.isSelf) {
        showToast("نمی‌توانید خودتان را اضافه کنید");
        return;
      }
      if (res.displayName && !displayName) {
        setDisplayName(res.displayName);
      }
    } catch {
      /* optional */
    }
  }

  async function invite() {
    if (!displayName.trim() || !mobile.trim()) {
      showToast("نام و موبایل الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await businessApi.inviteBusinessStaff(businessId, {
        displayName: displayName.trim(),
        mobile: mobile.trim(),
        preset,
      });
      showToast("پرسنل دعوت شد", "success");
      setLastInviteLink(res.inviteLink);
      setInviteOpen(false);
      setDisplayName("");
      setMobile("");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    } finally {
      setSaving(false);
    }
  }

  async function remove(memberId: string) {
    if (!confirm("این پرسنل حذف شود؟")) return;
    try {
      await businessApi.removeBusinessStaff(businessId, memberId);
      showToast("حذف شد", "success");
      void load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا");
    }
  }

  if (!hasBusinessPermission(permissions, "staff.view")) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-muted">
        دسترسی مشاهده پرسنل ندارید
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canInvite ? (
        <Button onPress={() => setInviteOpen(true)}>
          <Add size={18} />
          افزودن پرسنل
        </Button>
      ) : null}

      {lastInviteLink ? (
        <div className="rounded-xl bg-surface-secondary p-3 text-sm">
          <p className="text-muted">لینک دعوت (مدیر رمز تعیین نمی‌کند):</p>
          <Link href={lastInviteLink} className="break-all text-violet-600">
            {lastInviteLink}
          </Link>
        </div>
      ) : null}

      {loading ? (
        <div className="text-center text-muted">در حال بارگذاری…</div>
      ) : (
        <ul className="space-y-2">
          {staff.map((m) => (
            <li
              key={m._id}
              className="glass flex items-center justify-between rounded-2xl p-4"
            >
              <div>
                <p className="font-semibold">{m.displayName}</p>
                <p className="text-sm text-muted" dir="ltr">
                  {m.mobile}
                </p>
                <p className="text-xs text-muted">
                  {m.preset} · {m.status}
                </p>
                {canManageShifts && m.status === "active" ? (
                  <select
                    className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                    value={m.attendanceProfile?.shiftTemplateId ?? ""}
                    onChange={(e) =>
                      void assignShift(m._id, e.target.value)
                    }
                  >
                    <option value="">بدون شیفت</option>
                    {shiftTemplates.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              {canRemove && m.status !== "owner" ? (
                <Button
                  isIconOnly
                  variant="ghost"
                  aria-label="حذف"
                  onPress={() => void remove(m._id)}
                >
                  <Trash size={18} />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <AppModal open={inviteOpen} onOpenChange={setInviteOpen}>
        <AppModalDialog>
          <AppModalHeader>دعوت پرسنل</AppModalHeader>
          <div className="space-y-4 p-4">
            <p className="text-sm text-muted">
              رمز عبور توسط کارمند در اولین ورود تنظیم می‌شود — شما فقط موبایل
              و دسترسی را مشخص می‌کنید.
            </p>
            <FormInput
              label="موبایل"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              onBlur={() => void lookupMobile()}
            />
            <FormInput
              label="نام"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <label className="block text-sm">
              نقش پیش‌فرض
              <select
                className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2"
                value={preset}
                onChange={(e) =>
                  setPreset(e.target.value as BusinessRolePreset)
                }
              >
                {PRESET_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <Button
              className="w-full"
              onPress={() => void invite()}
              isPending={saving}
            >
              ارسال دعوت
            </Button>
          </div>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
