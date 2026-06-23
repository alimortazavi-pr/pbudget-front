"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { Trash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import * as partnersApi from "@/common/api/partners";
import type { IPartner, IVenture } from "@/common/interfaces/partner.interface";
import { showErrorToast, showToast } from "@/common/utils/toast";
import { FormInput, FormTextArea } from "@/components/common/form/FormFields";
import { PartnersSection } from "@/components/pages/partners/PartnersSection";
import { VentureBudgetSection } from "@/components/pages/partners/VentureBudgetSection";
import { VentureOverviewSection } from "@/components/pages/partners/VentureOverviewSection";
import { ContextPlanningBoard } from "@/components/pages/planning/ContextPlanningBoard";

type VentureDetailPageProps = {
  ventureId: string;
};

type TabId = "overview" | "partners" | "transactions" | "board" | "settings";

export function VentureDetailPage({ ventureId }: VentureDetailPageProps) {
  const router = useRouter();
  const [venture, setVenture] = useState<IVenture | null>(null);
  const [partners, setPartners] = useState<IPartner[]>([]);
  const [stats, setStats] = useState<{
    receivedAmount: number;
    spentAmount: number;
    profitAmount: number;
    transactionCount: number;
  }>();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await partnersApi.fetchVenture(ventureId);
      setVenture(data.venture);
      setPartners(data.partners);
      setStats(data.stats);
      setTitle(data.venture.title);
      setDescription(data.venture.description ?? "");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, [ventureId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!title.trim()) {
      showToast("نام الزامی است");
      return;
    }

    setSaving(true);
    try {
      const updated = await partnersApi.updateVenture(ventureId, {
        title: title.trim(),
        description: description.trim(),
      });
      setVenture(updated);
      showToast("ذخیره شد", "success");
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("کسب‌وکار و شرکای آن حذف شوند؟")) return;
    setDeleting(true);
    try {
      await partnersApi.deleteVenture(ventureId);
      showToast("حذف شد", "success");
      router.push(PATHS.VENTURES);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading || !venture) {
    return (
      <div className="glass rounded-2xl p-10 text-center text-muted">
        در حال بارگذاری…
      </div>
    );
  }

  const isPartner = venture.accessRole === "partner";

  const tabs = [
    { id: "overview" as const, label: "خلاصه" },
    { id: "partners" as const, label: "شرکا" },
    { id: "board" as const, label: "بورد برنامه‌ریزی" },
    { id: "transactions" as const, label: "تراکنش‌ها" },
    ...(!isPartner ? [{ id: "settings" as const, label: "تنظیمات" }] : []),
  ];

  return (
    <div className="space-y-5 pb-6">
      <section className="glass rounded-3xl p-5">
        <p className="text-sm text-muted">کسب‌وکار</p>
        <h1 className="mt-1 text-2xl font-bold">{venture.title}</h1>
        {isPartner ? (
          <p className="mt-2 rounded-lg bg-accent/10 px-2 py-1 text-xs text-accent">
            دسترسی مشترک — فقط مشاهده
          </p>
        ) : null}
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            data-venture-tab={item.id}
            onClick={() => setTab(item.id)}
            className={`shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === item.id
                ? "bg-accent text-accent-foreground"
                : "bg-surface-secondary text-muted"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <VentureOverviewSection
          ventureId={ventureId}
          venture={venture}
          partners={partners}
          stats={stats}
          readOnly={isPartner}
          onUpdated={(updated) => {
            setVenture(updated);
            setDescription(updated.description ?? "");
          }}
          onNavigateTab={setTab}
        />
      ) : null}

      {tab === "partners" ? (
        <PartnersSection
          contextType="venture"
          contextId={ventureId}
          readOnly={isPartner}
        />
      ) : null}

      {tab === "board" ? (
        <div className="glass rounded-2xl p-4">
          <ContextPlanningBoard
            contextType="venture"
            contextId={ventureId}
            readOnly={isPartner}
          />
        </div>
      ) : null}

      {tab === "transactions" ? (
        <VentureBudgetSection ventureId={ventureId} readOnly={isPartner} />
      ) : null}

      {tab === "settings" && !isPartner ? (
        <div className="space-y-4">
          <div className="glass space-y-4 rounded-2xl p-4">
            <FormInput
              label="نام کسب‌وکار"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormTextArea
              label="توضیحات"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button className="w-full" size="lg" onPress={() => void save()} isPending={saving}>
              ذخیره تغییرات
            </Button>
          </div>

          <section className="rounded-2xl border border-dashed border-danger/35 bg-danger/5 p-4">
            <p className="text-sm font-medium text-danger">منطقه خطر</p>
            <Button
              variant="danger"
              className="mt-3"
              onPress={() => void remove()}
              isPending={deleting}
            >
              <Trash size={16} />
              حذف کسب‌وکار
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
