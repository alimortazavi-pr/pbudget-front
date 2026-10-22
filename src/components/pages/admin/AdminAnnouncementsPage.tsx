"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, TextArea } from "@heroui/react";
import { Add, Edit2, Notification as NotificationIcon, Trash } from "iconsax-reactjs";

import * as api from "@/common/api/announcements";
import type { AdminAnnouncement, AnnouncementAudience, AnnouncementPayload, AnnouncementPlatform } from "@/common/api/announcements";
import { fetchAdminDiscounts, type AdminDiscountCode } from "@/common/api/subscriptions";
import { SwitchRow } from "@/components/common/form/FormKit";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { AdminPageHeader, ConfirmDialog, EmptyState, Field, FormDialog, NativeSelect, Pill, SkeletonRows, type Tone } from "./ui/AdminUi";
import { formatDateTimeFa } from "./ui/admin-format";

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  all: "همهٔ کاربران",
  no_plan: "کاربرانی که پلن نخریده‌اند",
  paid: "کاربران دارای پلن پولی",
};

const STATUS: Record<AdminAnnouncement["status"], { label: string; tone: Tone }> = {
  live: { label: "در حال نمایش", tone: "success" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "info" },
  ended: { label: "پایان‌یافته", tone: "neutral" },
  disabled: { label: "غیرفعال", tone: "warning" },
};

const DURATIONS = [
  { label: "۱ روز", hours: 24 },
  { label: "۲ روز", hours: 48 },
  { label: "۳ روز", hours: 72 },
  { label: "۷ روز", hours: 168 },
];

type Draft = Omit<AnnouncementPayload, "startsAt" | "endsAt"> & { endsAt: string | null };

const EMPTY: Draft = {
  title: "",
  body: "",
  audience: "no_plan",
  platforms: ["web"],
  discountCode: "",
  ctaLabel: "مشاهدهٔ پلن‌ها",
  endsAt: null,
  active: true,
};

/** Value for a datetime-local input (local time) from an ISO string. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<AdminAnnouncement[] | null>(null);
  const [codes, setCodes] = useState<AdminDiscountCode[]>([]);
  const [editing, setEditing] = useState<AdminAnnouncement | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<AdminAnnouncement | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.fetchAdminAnnouncements());
    } catch (error) {
      showErrorToast(error);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
    void fetchAdminDiscounts({ status: "live" })
      .then((data) => setCodes(data.items))
      .catch(() => undefined);
  }, [load]);

  function openNew() {
    setDraft(EMPTY);
    setEditing("new");
  }

  function openEdit(row: AdminAnnouncement) {
    setDraft({
      title: row.title,
      body: row.body,
      audience: row.audience,
      platforms: row.platforms,
      discountCode: row.discountCode,
      ctaLabel: row.ctaLabel,
      endsAt: row.endsAt,
      active: row.active,
    });
    setEditing(row);
  }

  const platformValue = draft.platforms.length === 2 ? "both" : draft.platforms[0];
  const codeOptions = useMemo(
    () => [{ value: "", label: "بدون کد تخفیف" }, ...codes.map((c) => ({ value: c.code, label: `${c.code} — ${c.title}` }))],
    [codes],
  );

  async function save() {
    setBusy(true);
    try {
      const payload: AnnouncementPayload = { ...draft, startsAt: null };
      if (editing === "new") await api.createAdminAnnouncement(payload);
      else if (editing) await api.updateAdminAnnouncement(editing._id, payload);
      showToast("ذخیره شد", "success");
      setEditing(null);
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(row: AdminAnnouncement) {
    try {
      await api.updateAdminAnnouncement(row._id, { active: !row.active });
      await load();
    } catch (error) {
      showErrorToast(error);
    }
  }

  async function remove() {
    if (!removing) return;
    setBusy(true);
    try {
      await api.deleteAdminAnnouncement(removing._id);
      setRemoving(null);
      await load();
    } catch (error) {
      showErrorToast(error);
    } finally {
      setBusy(false);
    }
  }

  const valid = draft.title.trim().length >= 2 && draft.body.trim().length >= 2;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="اعلان‌ها و پیام‌ها"
        description="پیامی که به‌صورت مدال به کاربران نشان داده می‌شود (مثلاً پیشنهاد تخفیف). هر کاربر هر پیام را یک‌بار می‌بیند و با بستنش دیگر نمایش داده نمی‌شود."
        icon={<NotificationIcon size={22} variant="Bold" />}
        actions={
          <Button onPress={openNew}>
            <Add size={18} /> پیام جدید
          </Button>
        }
      />

      {rows === null ? (
        <SkeletonRows rows={4} height="h-24" />
      ) : rows.length === 0 ? (
        <EmptyState title="هنوز پیامی نساخته‌اید" description="با «پیام جدید» یک اعلان یا پیشنهاد ویژه برای کاربران بسازید." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const status = STATUS[row.status];
            const rate = row.viewCount ? Math.round((row.ctaCount / row.viewCount) * 100) : 0;
            return (
              <div key={row._id} className="glass space-y-3 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{row.title}</h3>
                      <Pill tone={status.tone}>{status.label}</Pill>
                      {row.discountCode ? <Pill tone="accent">{row.discountCode}</Pill> : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{row.body}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onPress={() => void toggle(row)}>
                      {row.active ? "غیرفعال کن" : "فعال کن"}
                    </Button>
                    <Button size="sm" variant="ghost" isIconOnly aria-label="ویرایش" onPress={() => openEdit(row)}>
                      <Edit2 size={16} />
                    </Button>
                    <Button size="sm" variant="ghost" isIconOnly aria-label="حذف" onPress={() => setRemoving(row)}>
                      <Trash size={16} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
                  <span>مخاطب: {AUDIENCE_LABEL[row.audience]}</span>
                  <span>محل نمایش: {row.platforms.map((p) => (p === "web" ? "وب" : "اپ اندروید")).join("، ")}</span>
                  <span>پایان: {row.endsAt ? formatDateTimeFa(row.endsAt) : "بدون پایان"}</span>
                  <span>دیده‌شده: {toPersianDigits(row.viewCount)}</span>
                  <span>
                    کلیک روی دکمه: {toPersianDigits(row.ctaCount)} ({toPersianDigits(rate)}٪)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === "new" ? "پیام جدید" : "ویرایش پیام"}
        description="کاربر این پیام را به‌صورت مدال روی صفحه می‌بیند."
        isPending={busy}
        submitDisabled={!valid}
        onSubmit={() => void save()}
        wide
      >
        <Field label="عنوان">
          <Input variant="secondary" maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="مثلاً: ۵۰٪ تخفیف پلن حرفه‌ای" />
        </Field>
        <Field label="متن پیام">
          <TextArea variant="secondary" rows={5} maxLength={1500} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="فقط تا ۲ روز دیگر می‌توانید با کد زیر پلن حرفه‌ای را نصف قیمت بخرید." />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="مخاطب">
            <NativeSelect
              ariaLabel="مخاطب"
              value={draft.audience}
              onChange={(v) => setDraft({ ...draft, audience: v as AnnouncementAudience })}
              options={(Object.keys(AUDIENCE_LABEL) as AnnouncementAudience[]).map((value) => ({ value, label: AUDIENCE_LABEL[value] }))}
            />
          </Field>
          <Field label="محل نمایش" hint="کد تخفیف فقط روی وب و پرداخت بله کار می‌کند؛ برای پیشنهاد تخفیف «وب» را بگذارید.">
            <NativeSelect
              ariaLabel="محل نمایش"
              value={platformValue}
              onChange={(v) => setDraft({ ...draft, platforms: v === "both" ? ["web", "android"] : [v as AnnouncementPlatform] })}
              options={[
                { value: "web", label: "فقط وب" },
                { value: "android", label: "فقط اپ اندروید" },
                { value: "both", label: "وب و اپ اندروید" },
              ]}
            />
          </Field>
          <Field label="کد تخفیف (اختیاری)" hint="کد در مدال بزرگ نشان داده می‌شود و دکمهٔ کپی دارد. کدها را از بخش اشتراک‌ها بسازید.">
            <NativeSelect ariaLabel="کد تخفیف" value={draft.discountCode} onChange={(v) => setDraft({ ...draft, discountCode: v })} options={codeOptions} />
          </Field>
          <Field label="متن دکمهٔ اصلی" hint="دکمه کاربر را به صفحهٔ پلن‌ها می‌برد. خالی = بدون دکمه.">
            <Input variant="secondary" maxLength={40} value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} />
          </Field>
        </div>
        <Field label="پایان نمایش" hint="بعد از این زمان پیام دیگر نشان داده نمی‌شود و تا آن موقع شمارش معکوس در مدال دیده می‌شود.">
          <div className="flex flex-wrap items-center gap-2">
            {DURATIONS.map((d) => (
              <Button key={d.hours} size="sm" variant="secondary" onPress={() => setDraft({ ...draft, endsAt: new Date(Date.now() + d.hours * 3600_000).toISOString() })}>
                {d.label} دیگر
              </Button>
            ))}
            <Button size="sm" variant="ghost" onPress={() => setDraft({ ...draft, endsAt: null })}>
              بدون پایان
            </Button>
          </div>
          <Input
            variant="secondary"
            type="datetime-local"
            dir="ltr"
            value={toLocalInput(draft.endsAt)}
            onChange={(e) => setDraft({ ...draft, endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
          />
          {draft.endsAt ? <span className="text-xs text-muted">پایان: {formatDateTimeFa(draft.endsAt)}</span> : null}
        </Field>
        <SwitchRow label="فعال" description="با غیرفعال کردن، پیام از نمایش خارج می‌شود." selected={draft.active} onChange={(active) => setDraft({ ...draft, active })} />
      </FormDialog>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="حذف پیام؟"
        description={`«${removing?.title ?? ""}» و آمار آن حذف می‌شود.`}
        confirmLabel="حذف"
        isPending={busy}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
