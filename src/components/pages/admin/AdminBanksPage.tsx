"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, Bank, Edit2, Trash } from "iconsax-reactjs";

import * as banksApi from "@/common/api/banks";
import type { IBank } from "@/common/interfaces/bank.interface";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";

const PARSER_OPTIONS = [{ id: "blubank", label: "بلوبانک (Excel)" }];

export function AdminBanksPage() {
  const [banks, setBanks] = useState<IBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<IBank | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [parserType, setParserType] = useState("blubank");
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await banksApi.fetchAdminBanks();
      setBanks(data);
    } catch {
      showToast("بارگذاری بانک‌ها ناموفق بود", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditItem(null);
    setTitle("");
    setSlug("");
    setParserType("blubank");
    setActive(true);
    setSortOrder("0");
    setOpen(true);
  }

  function openEdit(bank: IBank) {
    setEditItem(bank);
    setTitle(bank.title);
    setSlug(bank.slug);
    setParserType(bank.parserType);
    setActive(bank.active);
    setSortOrder(String(bank.sortOrder ?? 0));
    setOpen(true);
  }

  async function save() {
    if (!title.trim() || !slug.trim()) {
      showToast("عنوان و شناسه بانک الزامی است", "danger");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        parserType,
        active,
        sortOrder: Number(sortOrder) || 0,
      };

      if (editItem) {
        const updated = await banksApi.updateAdminBank(editItem._id, payload);
        setBanks((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
      } else {
        const created = await banksApi.createAdminBank(payload);
        setBanks((prev) => [...prev, created]);
      }

      showToast("ذخیره شد", "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در ذخیره", "danger");
    } finally {
      setSaving(false);
    }
  }

  async function removeBank(bank: IBank) {
    if (!window.confirm(`بانک «${bank.title}» حذف شود؟`)) return;
    try {
      await banksApi.deleteAdminBank(bank._id);
      setBanks((prev) => prev.filter((item) => item._id !== bank._id));
      showToast("بانک حذف شد", "success");
    } catch {
      showToast("حذف ناموفق بود", "danger");
    }
  }

  if (loading && !banks.length) {
    return <div className="glass h-64 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">بانک‌ها</h3>
          <p className="text-sm text-muted">
            بانک‌های پشتیبانی‌شده برای ایمپورت صورتحساب — پارسر بلوبانک از قبل فعال است
          </p>
        </div>
        <Button onPress={openCreate}>
          <Add size={18} />
          بانک جدید
        </Button>
      </div>

      <div className="grid gap-4">
        {banks.map((bank) => (
          <article key={bank._id} className="glass rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-accent/10 p-2.5 text-accent">
                  <Bank size={22} variant="Bold" />
                </div>
                <div>
                  <h4 className="font-bold">{bank.title}</h4>
                  <p className="mt-1 text-sm text-muted" dir="ltr">
                    {bank.slug} · {bank.parserType}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        bank.active
                          ? "bg-success/10 text-success-foreground"
                          : "bg-muted/20 text-muted"
                      }`}
                    >
                      {bank.active ? "فعال" : "غیرفعال"}
                    </span>
                    <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                      ترتیب: {bank.sortOrder}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onPress={() => openEdit(bank)}>
                  <Edit2 size={16} />
                  ویرایش
                </Button>
                <Button size="sm" variant="danger" onPress={() => void removeBank(bank)}>
                  <Trash size={16} />
                  حذف
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <AppModal open={open} onOpenChange={setOpen}>
        <AppModalDialog className="sm:max-w-md">
          <AppModalHeader>
            <Modal.Heading>{editItem ? "ویرایش بانک" : "بانک جدید"}</Modal.Heading>
          </AppModalHeader>
          <div className="space-y-4 p-4">
            <FormInput label="نام بانک" value={title} onChange={(e) => setTitle(e.target.value)} />
            <FormInput
              label="شناسه (slug)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="blubank"
              dir="ltr"
            />
            <FormSelect
              label="نوع پارسر"
              selectedKey={parserType}
              onSelectionChange={(key) => setParserType(key)}
              options={PARSER_OPTIONS}
            />
            <FormInput
              label="ترتیب نمایش"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              inputMode="numeric"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              فعال برای کاربران
            </label>
            <Button className="w-full" isPending={saving} onPress={() => void save()}>
              ذخیره
            </Button>
          </div>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
