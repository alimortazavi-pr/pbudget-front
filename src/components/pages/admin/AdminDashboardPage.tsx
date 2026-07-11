"use client";

import { getTranslator } from "@/i18n";
const t = getTranslator();

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  Chart,
  Cpu,
  Data,
  People,
  SecuritySafe,
  Wallet2,
} from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type {
  AdminActivitySeries,
  AdminHealth,
  AdminOverview,
} from "@/common/interfaces/admin";
import { formatBytes, formatUptime } from "@/common/utils/admin-format";
import { formatPrice, toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

const AdminActivityCharts = dynamic(
  () =>
    import("@/components/pages/admin/AdminActivityCharts").then(
      (mod) => mod.AdminActivityCharts,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="glass h-72 animate-pulse rounded-2xl" />
    ),
  },
);

function KpiCard({
  title,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "accent"
          ? "text-accent"
          : "text-accent";

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className={`rounded-xl bg-surface-secondary p-2.5 ${toneClass}`}>
          {icon}
        </div>
      </div>
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

function HealthBadge({ health }: { health: AdminHealth | null }) {
  if (!health) return null;

  const ok = health.status === "healthy";
  return (
    <span className={`pb-status-badge ${ok ? "pb-status-badge-success" : "pb-status-badge-warning"}`}>
      <SecuritySafe size={14} variant="Bold" />
      {ok ? t("auto.k3204ba7a05") : t("auto.k9de9ddc810")}
    </span>
  );
}

export function AdminDashboardPage() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [activity, setActivity] = useState<AdminActivitySeries | null>(null);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [overviewResult, activityResult, healthResult] =
        await Promise.allSettled([
          adminApi.fetchAdminOverview(),
          adminApi.fetchAdminActivity(30),
          adminApi.fetchAdminHealth(),
        ]);

      if (overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
      }
      if (activityResult.status === "fulfilled") {
        setActivity(activityResult.value);
      }
      if (healthResult.status === "fulfilled") {
        setHealth(healthResult.value);
      }

      const failures = [overviewResult, activityResult, healthResult].filter(
        (result) => result.status === "rejected",
      );

      if (failures.length === 3) {
        const message = t("auto.kd654c7d39e");
        setLoadError(message);
        showToast(message, "danger");
      } else if (overviewResult.status === "rejected") {
        const message = t("auto.k3c6d526b1b");
        setLoadError(message);
        showToast(message, "danger");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load({ silent: true }), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading && !overview) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass h-36 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="glass space-y-4 rounded-2xl p-8 text-center">
        <p className="text-muted">
          {loadError ?? t("auto.k5703facb58")}
        </p>
        <button
          type="button"
          className="text-sm font-medium text-accent hover:underline"
          onClick={() => void load()}
        >
          {t("common.tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{t("auto.k3a7b1b4d58")}</h3>
          <p className="text-sm text-muted">
            {t("auto.k2aaada114f")}
          </p>
        </div>
        <HealthBadge health={health} />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title={t("auto.k81289a2cf6")}
          value={toPersianDigits(overview.users.total)}
          subtitle={`${toPersianDigits(overview.users.newThisMonth)} ${t("auto.k883da9f030")} ${t("auto.k64dfbb8da9")} ${t("auto.k3b9e49d3a6")} ${t("auto.k1c9e87a670")}`}
          icon={<People size={22} variant="Bold" />}
        />
        <KpiCard
          title={t("auto.k6baa9cfb85")}
          value={toPersianDigits(overview.users.active)}
          subtitle={`${toPersianDigits(overview.users.admins)} ${t("auto.k65497ce419")}`}
          icon={<Activity size={22} variant="Bold" />}
          tone="success"
        />
        <KpiCard
          title={t("auto.k4868be73ce")}
          value={toPersianDigits(overview.transactions.total)}
          subtitle={`${toPersianDigits(overview.transactions.thisWeek)} ${t("auto.keb7bb3e55b")} ${t("auto.k3b9e49d3a6")} ${t("auto.k400cd4c1c1")}`}
          icon={<Wallet2 size={22} variant="Bold" />}
          tone="accent"
        />
        <KpiCard
          title={t("auto.k1410347753")}
          value={formatBytes(overview.database.totalSizeBytes)}
          subtitle={`${toPersianDigits(overview.database.collections)} ${t("auto.k856205a73e")}`}
          icon={<Data size={22} variant="Bold" />}
        />
      </section>

      {activity && <AdminActivityCharts activity={activity} />}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-5">
          <div className="mb-4 flex items-center gap-2">
            <Chart size={20} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("auto.kee0303975f")}</h4>
          </div>
          <div className="space-y-3">
            {overview.topCollections.map((collection) => (
              <div
                key={collection.name}
                className="flex items-center justify-between rounded-xl bg-surface-secondary/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{collection.name}</p>
                  <p className="text-xs text-muted">
                    {formatBytes(collection.estimatedSizeBytes)}
                  </p>
                </div>
                <p className="text-sm font-bold">
                  {toPersianDigits(collection.documentCount)} {t("auto.k598f6819da")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {health && (
          <div className="glass rounded-2xl p-5">
            <div className="mb-4 flex items-center gap-2">
              <Cpu size={20} className="text-accent" variant="Bold" />
              <h4 className="font-bold">{t("auto.ka8b50ffe7e")}</h4>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.ke66493bb3d")}</dt>
                <dd className="font-medium">
                  {formatUptime(health.uptimeSeconds)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">MongoDB</dt>
                <dd className="font-medium">
                  {health.mongodb.status === "connected"
                    ? t("admin.connectedLatency", {
                        ms: toPersianDigits(health.mongodb.latencyMs ?? 0),
                      })
                    : t("auto.k3b3debf3ff")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.kaaee936d10")}</dt>
                <dd className="font-medium">
                  {formatBytes(health.memory.heapUsedBytes)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.ke820e30a5b")}</dt>
                <dd className="font-medium">{health.environment}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.kfb3c0b0e11")}</dt>
                <dd className="font-medium">
                  {health.backup.telegramEnabled ? t("auto.k25c499f433") : t("auto.k7fdadc73ac")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.k031675aa41")}</dt>
                <dd className="font-medium">
                  {toPersianDigits(overview.database.documents)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.k1c97d0b9a0")}</dt>
                <dd className="font-medium text-emerald-600">
                  {formatPrice(
                    activity?.income.reduce((sum, n) => sum + n, 0) ?? 0,
                  )}{" "}
                  {t("auto.k9e29f60874")}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
