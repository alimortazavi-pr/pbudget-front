"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { Notification } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import { compareVersions } from "@/common/constants/app-version";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormTextArea } from "@/components/common/form/FormFields";

export type ReleaseNotesOption = { version: string; title: string; items: string[] };

/**
 * The admin writes the "what's new" message and decides whether users see it. Nothing is shown until it is switched
 * on; every save of changed text (or "show again") makes everyone see it once more.
 */
export function AdminReleaseNotesCard({ options }: { options: ReleaseNotesOption[] }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [revision, setRevision] = useState(0);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.fetchReleaseNotes();
      setEnabled(data.enabled);
      setTitle(data.title);
      setItemsText(data.items.join("\n"));
      setRevision(data.revision);
    } catch {
      showToast("بارگذاری پیام تغییرات ناموفق بود", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = [...options].sort((a, b) => compareVersions(b.version, a.version));

  async function save(next: { enabled: boolean; resend?: boolean }) {
    setSaving(true);
    try {
      const data = await adminApi.saveReleaseNotes({
        enabled: next.enabled,
        title,
        items: itemsText.split("\n"),
        resend: next.resend,
      });
      setEnabled(data.enabled);
      setRevision(data.revision);
      showToast(data.enabled ? "پیام برای کاربران نمایش داده می‌شود" : "پیام مخفی شد", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "ذخیره ناموفق بود", "danger");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass space-y-4 rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Notification size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">پیام «چه چیزهایی جدید است؟»</h4>
          </div>
          <p className="mt-1 text-sm leading-7 text-muted">
            متن را خودتان بنویسید و تعیین کنید به کاربران نشان داده شود یا نه. تا وقتی «نمایش» روشن نباشد هیچ‌کس پیامی نمی‌بیند. هر کاربر هر
            نسخه از پیام را فقط یک‌بار می‌بیند.
          </p>
        </div>
        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${enabled ? "bg-income-soft text-income" : "bg-surface-secondary text-muted"}`}>
          {enabled ? "در حال نمایش" : "مخفی"}
        </span>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-surface-secondary" />
      ) : (
        <>
          {sorted.length ? (
            <div>
              <p className="mb-2 text-xs text-muted">پر کردن از تغییرات یکی از نسخه‌ها:</p>
              <div className="flex flex-wrap gap-2">
                {sorted.slice(0, 6).map((o) => (
                  <button
                    key={o.version}
                    type="button"
                    className="pb-press rounded-xl border border-border/60 bg-surface-secondary/60 px-3 py-1.5 text-xs font-medium hover:border-accent/50"
                    onClick={() => {
                      setTitle(o.title);
                      setItemsText(o.items.join("\n"));
                    }}
                  >
                    {toPersianDigits(o.version)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <FormInput label="عنوان" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً نسخهٔ ۲٫۱۱ — ساده‌تر برای پرسنل" />
          <FormTextArea label="موارد (هر خط یک مورد)" value={itemsText} onChange={(e) => setItemsText(e.target.value)} rows={7} />

          <div className="flex flex-col gap-2 sm:flex-row">
            {enabled ? (
              <>
                <Button className="flex-1" isPending={saving} onPress={() => void save({ enabled: true })}>
                  ذخیرهٔ تغییرات
                </Button>
                <Button variant="secondary" className="flex-1" isDisabled={saving} onPress={() => void save({ enabled: true, resend: true })}>
                  نمایش دوباره به همه
                </Button>
                <Button variant="ghost" className="flex-1 text-expense" isDisabled={saving} onPress={() => void save({ enabled: false })}>
                  مخفی کردن
                </Button>
              </>
            ) : (
              <>
                <Button className="flex-1" isPending={saving} isDisabled={!title.trim() || !itemsText.trim()} onPress={() => void save({ enabled: true })}>
                  نمایش به کاربران
                </Button>
                <Button variant="secondary" className="flex-1" isDisabled={saving} onPress={() => void save({ enabled: false })}>
                  فقط ذخیره (مخفی)
                </Button>
              </>
            )}
          </div>
          {revision > 0 ? <p className="text-[11px] text-muted">شمارهٔ انتشار: {toPersianDigits(revision)}</p> : null}
        </>
      )}
    </section>
  );
}
