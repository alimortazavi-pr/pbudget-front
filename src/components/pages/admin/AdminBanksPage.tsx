"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, Bank, Edit2, Trash } from "iconsax-reactjs";

import * as banksApi from "@/common/api/banks";
import type { IBank } from "@/common/interfaces/bank.interface";
import { showToast } from "@/common/utils/toast";
import { FormInput, FormSelect } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";

const PARSER_OPTIONS = [{ id: "blubank", label: t("auto.k3237e32a0a") }];

export function AdminBanksPage() {
  const { t } = useTranslation();
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
      showToast(t("auto.kc30b8bd654"), "danger");
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
      showToast(t("auto.kcf531861e6"), "danger");
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

      showToast(t("common.saved"), "success");
      setOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t("auto.k01981ce4e8"), "danger");
    } finally {
      setSaving(false);
    }
  }

  async function removeBank(bank: IBank) {
    if (!window.confirm(t("admin.deleteBankConfirm", { name: bank.title }))) return;
    try {
      await banksApi.deleteAdminBank(bank._id);
      setBanks((prev) => prev.filter((item) => item._id !== bank._id));
      showToast(t("auto.kd7af44f5a8"), "success");
    } catch {
      showToast(t("auto.k39c946fb1c"), "danger");
    }
  }

  if (loading && !banks.length) {
    return <div className="glass h-64 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">{t("auto.ke69411b3f7")}</h3>
          <p className="text-sm text-muted">
            {t("auto.k0d266d6739")}
          </p>
        </div>
        <Button onPress={openCreate}>
          <Add size={18} />
          {t("auto.k1f4ad95efd")}
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
                      {bank.active ? t("auto.k25c499f433") : t("auto.k7fdadc73ac")}
                    </span>
                    <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                      {t("auto.k243395a2af")}{bank.sortOrder}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onPress={() => openEdit(bank)}>
                  <Edit2 size={16} />
                  {t("common.edit")}
                </Button>
                <Button size="sm" variant="danger" onPress={() => void removeBank(bank)}>
                  <Trash size={16} />
                  {t("common.delete")}
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <AppModal open={open} onOpenChange={setOpen}>
        <AppModalDialog className="sm:max-w-md">
          <AppModalHeader>
            <Modal.Heading>{editItem ? t("auto.k2b3ad62018") : t("auto.k1f4ad95efd")}</Modal.Heading>
          </AppModalHeader>
          <div className="space-y-4 p-4">
            <FormInput label={t("auto.kd58cb05310")} value={title} onChange={(e) => setTitle(e.target.value)} />
            <FormInput
              label={t("auto.k503016e279")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="blubank"
              dir="ltr"
            />
            <FormSelect
              label={t("auto.k5bcb84b225")}
              selectedKey={parserType}
              onSelectionChange={(key) => setParserType(key)}
              options={PARSER_OPTIONS}
            />
            <FormInput
              label={t("auto.kbd34880aa6")}
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
              {t("auto.k2b945b1870")}
            </label>
            <Button className="w-full" isPending={saving} onPress={() => void save()}>
              {t("common.save")}
            </Button>
          </div>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
