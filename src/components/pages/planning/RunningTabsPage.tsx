"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { Add, Edit2, Minus, Trash, Wallet } from "iconsax-reactjs";

import * as runningTabsApi from "@/common/api/running-tabs";
import type { IRunningTab } from "@/common/interfaces/running-tab.interface";
import { formatPrice, formatCount, toEnglishDigits } from "@/common/utils";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormPriceInput } from "@/components/common/form/FormFields";
import { PageHeroSection } from "@/components/common/layout/PageHeroSection";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { chipClass } from "@/components/pages/planning/planning-shared";

type FilterTab = "all" | "active" | "zero";

const BUMP_STEPS = [10_000, 50_000, 100_000] as const;

export function RunningTabsPage() {
  const { t } = useTranslation();
  const [tabs, setTabs] = useState<IRunningTab[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTab, setEditTab] = useState<IRunningTab | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await runningTabsApi.fetchRunningTabs();
      setTabs(list);
    } catch (err) {
      showErrorToast(err, t("pages.planning.commitmentsLoadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const withBalance = tabs.filter((tab) => tab.amount > 0);
    return {
      total: tabs.reduce((sum, tab) => sum + tab.amount, 0),
      activeCount: withBalance.length,
      zeroCount: tabs.length - withBalance.length,
    };
  }, [tabs]);

  const visibleTabs = useMemo(() => {
    if (filter === "active") return tabs.filter((tab) => tab.amount > 0);
    if (filter === "zero") return tabs.filter((tab) => tab.amount <= 0);
    return tabs;
  }, [tabs, filter]);

  function openCreate() {
    setEditTab(null);
    setTitle("");
    setAmount("");
    setCreateOpen(true);
  }

  function openEdit(tab: IRunningTab) {
    setEditTab(tab);
    setTitle(tab.title);
    setAmount(String(tab.amount));
    setCreateOpen(true);
  }

  async function saveTab() {
    if (!title.trim()) {
      showToast(t("auto.kc684d17ce8"));
      return;
    }

    setSaving(true);
    try {
      if (editTab) {
        const updated = await runningTabsApi.updateRunningTab(editTab._id, {
          title: title.trim(),
          amount: amount ? toEnglishDigits(amount) : "0",
        });
        setTabs((prev) => prev.map((item) => (item._id === editTab._id ? updated : item)));
        showToast(t("common.saved"), "success");
      } else {
        const tab = await runningTabsApi.createRunningTab({
          title: title.trim(),
          amount: amount ? toEnglishDigits(amount) : undefined,
        });
        setTabs((prev) => [tab, ...prev]);
        showToast(t("auto.ke55428888d"), "success");
      }
      setCreateOpen(false);
      setEditTab(null);
      setTitle("");
      setAmount("");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSaving(false);
    }
  }

  async function adjust(tab: IRunningTab, delta: number) {
    setBusyId(tab._id);
    try {
      const updated = await runningTabsApi.adjustRunningTab(tab._id, String(delta));
      setTabs((prev) => prev.map((item) => (item._id === tab._id ? updated : item)));
    } catch (err) {
      showErrorToast(err);
    } finally {
      setBusyId(null);
    }
  }

  async function clearTab(tab: IRunningTab) {
    if (tab.amount <= 0) return;
    setBusyId(tab._id);
    try {
      const updated = await runningTabsApi.clearRunningTab(tab._id);
      setTabs((prev) => prev.map((item) => (item._id === tab._id ? updated : item)));
      showToast(t("auto.k4978a41d38"), "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setBusyId(null);
    }
  }

  async function removeTab(tab: IRunningTab) {
    if (!confirm(t("pages.planning.deleteTabConfirm", { name: tab.title }))) return;
    setBusyId(tab._id);
    try {
      await runningTabsApi.deleteRunningTab(tab._id);
      setTabs((prev) => prev.filter((item) => item._id !== tab._id));
      showToast(t("common.deleted"), "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <PageHeroSection
        variant="amber"
        eyebrow={t("pageHero.commitments.eyebrow")}
        title={t("nav.commitments")}
        description={t("pageHero.commitments.description")}
        descriptionClassName="mt-2 text-sm leading-7 text-white/85"
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">{t("auto.k687b7c8520")}</p>
          <p className="mt-2 text-2xl font-bold text-expense">{formatPrice(stats.total)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">{t("auto.k1154b54f83")}</p>
          <p className="mt-2 text-2xl font-bold">{formatCount(stats.activeCount)}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted">{t("auto.k4ad9f4a7b5")}</p>
          <p className="mt-2 text-2xl font-bold text-muted">{formatCount(stats.zeroCount)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "active" as const, label: t("pages.planning.runningFilterActive") },
              { id: "all" as const, label: t("pages.planning.runningFilterAll") },
              { id: "zero" as const, label: t("pages.planning.runningFilterZero") },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={chipClass(filter === item.id)}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button size="sm" onPress={openCreate}>
          <Add size={16} />
          {t("auto.ke0d1e76a1f")}
        </Button>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted">{t("common.loading")}</p>
      ) : visibleTabs.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
          {filter === "active"
            ? t("pages.planning.runningEmptyActive")
            : filter === "zero"
              ? t("pages.planning.runningEmptyZero")
              : t("pages.planning.runningEmptyNone")}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleTabs.map((tab) => (
            <article
              key={tab._id}
              className="glass space-y-3 rounded-2xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="shrink-0 text-accent" variant="Bold" />
                    <h2 className="truncate text-lg font-semibold">{tab.title}</h2>
                  </div>
                  <p
                    className={`mt-2 text-2xl font-bold ${
                      tab.amount > 0 ? "text-expense" : "text-muted"
                    }`}
                  >
                    {formatPrice(tab.amount)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    isDisabled={busyId === tab._id}
                    onPress={() => openEdit(tab)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    isDisabled={busyId === tab._id}
                    onPress={() => void removeTab(tab)}
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {BUMP_STEPS.map((step) => (
                  <Button
                    key={`minus-${step}`}
                    size="sm"
                    variant="secondary"
                    isDisabled={busyId === tab._id}
                    onPress={() => void adjust(tab, -step)}
                  >
                    <Minus size={14} />
                    {formatPrice(step).replace(t("auto.k114bf5731a"), "")}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {BUMP_STEPS.map((step) => (
                  <Button
                    key={`plus-${step}`}
                    size="sm"
                    variant="secondary"
                    isDisabled={busyId === tab._id}
                    onPress={() => void adjust(tab, step)}
                  >
                    <Add size={14} />
                    {formatPrice(step).replace(t("auto.k114bf5731a"), "")}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full"
                variant="secondary"
                isDisabled={busyId === tab._id || tab.amount <= 0}
                onPress={() => void clearTab(tab)}
              >
                {t("auto.k68e559c6da")}
              </Button>
            </article>
          ))}
        </div>
      )}

      <AppModal open={createOpen} onOpenChange={setCreateOpen}>
        <AppModalDialog className="max-w-sm">
          <AppModalHeader onClose={() => setCreateOpen(false)}>
            <Modal.Heading>
              {editTab ? t("pages.planning.runningEditTitle") : t("pages.planning.runningNewTitle")}
            </Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-4">
            <FormInput
              label={t("common.title")}
              placeholder={t("auto.k4b6b173916")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormPriceInput
              label={t("auto.keec44b6191")}
              value={amount}
              onChange={setAmount}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button isPending={saving} onPress={() => void saveTab()}>
              {editTab ? t("pages.planning.runningSave") : t("pages.planning.runningSubmit")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}
