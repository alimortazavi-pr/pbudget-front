"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { CloudAdd, DocumentDownload, DocumentUpload, Timer1 } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type {
  AdminBackupInfo,
  AdminBackupRun,
  AdminExportFormat,
  AdminImportMode,
} from "@/common/interfaces/admin";
import { formatBytes } from "@/common/utils/admin-format";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

export function AdminBackupPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AdminBackupInfo | null>(null);
  const [history, setHistory] = useState<AdminBackupRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [format, setFormat] = useState<AdminExportFormat>("ejson");
  const [importMode, setImportMode] = useState<AdminImportMode>("merge");
  const zipInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [infoData, historyData] = await Promise.all([
        adminApi.fetchBackupInfo(),
        adminApi.fetchBackupHistory(1, 15),
      ]);
      setInfo(infoData);
      setHistory(historyData.items);
    } catch {
      showToast(t("auto.k159c031946"), "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runBackup = async () => {
    setRunning(true);
    try {
      await adminApi.runBackup();
      showToast(t("auto.k023da5675d"), "success");
      void load();
    } catch {
      showToast(t("auto.k95dcae746a"), "danger");
    } finally {
      setRunning(false);
    }
  };

  const downloadLocal = async () => {
    setRunning(true);
    try {
      await adminApi.downloadFullDatabaseExport(format);
      showToast(t("auto.kd0ee785fff"), "success");
    } catch {
      showToast(t("auto.k72a0e2fd88"), "danger");
    } finally {
      setRunning(false);
    }
  };

  const handleZipImport = async (file: File | undefined) => {
    if (!file) return;
    setRunning(true);
    try {
      const result = await adminApi.importBackupZip(file, importMode);
      showToast(
        `بازیابی انجام شد — ${toPersianDigits(result.totalDocuments)} سند`,
        "success",
      );
      void load();
    } catch {
      showToast(t("auto.kb154525e37"), "danger");
    } finally {
      setRunning(false);
      if (zipInputRef.current) zipInputRef.current.value = "";
    }
  };

  if (loading && !info) {
    return <div className="glass h-64 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">{t("auto.k7c2a8d5824")}</h3>
        <p className="text-sm text-muted">
          بکاپ خودکار، اجرای دستی، دانلود و بازیابی ZIP
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Timer1 size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("auto.k699d3dc3ca")}</h4>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.ke200e8d973")}</dt>
              <dd>{info?.schedule.description}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.k5b0b21f9fb")}</dt>
              <dd>{info?.schedule.timezone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.kca3d2562e4")}</dt>
              <dd>{info?.telegram.enabled ? "فعال" : "غیرفعال"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.kf778c250f4")}</dt>
              <dd>{formatBytes(info?.telegram.maxFileSizeBytes ?? 0)}</dd>
            </div>
          </dl>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <CloudAdd size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("auto.kd22866dae0")}</h4>
          </div>
          {info?.lastRun ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.ka0bb13461f")}</dt>
                <dd className="truncate font-mono text-xs">{info.lastRun.filename}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.k0ba84ad8e7")}</dt>
                <dd>{toPersianDigits(info.lastRun.collections)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.k5b4218ff28")}</dt>
                <dd>{toPersianDigits(info.lastRun.documents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("auto.k31414a116f")}</dt>
                <dd>{formatBytes(info.lastRun.byteSize)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">{t("auto.k3969612372")}</p>
          )}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h4 className="mb-4 font-bold">{t("auto.k0f0dff2dfc")}</h4>
        <div className="flex flex-wrap gap-3">
          <Button onPress={() => void runBackup()} isDisabled={running}>
            <CloudAdd size={18} />
            ارسال بکاپ به تلگرام
          </Button>
          <Button
            variant="secondary"
            onPress={() => void downloadLocal()}
            isDisabled={running}
          >
            <DocumentDownload size={18} />
            دانلود ZIP محلی
          </Button>
          <Button
            variant="secondary"
            onPress={() => zipInputRef.current?.click()}
            isDisabled={running}
          >
            <DocumentUpload size={18} />
            بازیابی از ZIP
          </Button>
          <input
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip"
            className="hidden"
            onChange={(e) => void handleZipImport(e.target.files?.[0])}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{t("auto.k89afe16d18")}</span>
            {(["ejson", "json", "csv"] as AdminExportFormat[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  format === item
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-secondary text-muted"
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted">{t("auto.k94ec810b70")}</span>
            {(
              [
                { value: "merge", label: "ادغام (upsert)" },
                { value: "replace", label: "جایگزینی کامل" },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setImportMode(item.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  importMode === item.value
                    ? "bg-warning/20 text-warning-foreground"
                    : "bg-surface-secondary text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-border/50 px-5 py-4">
          <h4 className="font-bold">{t("auto.kdefd6c84cf")}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k299c8c9aa7")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k66f403b6e5")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k2f3c6cf127")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k856205a73e")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k5b4218ff28")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k31414a116f")}</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    تاریخچه‌ای ثبت نشده
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id ?? item.createdAt} className="border-t border-border/50">
                    <td className="px-4 py-3 text-xs text-muted">
                      {new Date(item.createdAt).toLocaleString("fa-IR")}
                    </td>
                    <td className="px-4 py-3">
                      {item.source === "scheduled" ? "خودکار" : "دستی"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          item.status === "failed"
                            ? "bg-danger/10 text-danger"
                            : "bg-success/10 text-success-foreground"
                        }`}
                      >
                        {item.status === "failed" ? "ناموفق" : "موفق"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{toPersianDigits(item.collections)}</td>
                    <td className="px-4 py-3">{toPersianDigits(item.documents)}</td>
                    <td className="px-4 py-3">{formatBytes(item.byteSize)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface-secondary/40 p-5">
        <h4 className="mb-2 font-bold text-sm">{t("auto.k556846e399")}</h4>
        <pre className="overflow-x-auto rounded-xl bg-background p-4 text-xs leading-relaxed text-muted">
          {info?.importHint}
          {"\n\n"}
          # حالت merge: اسناد با همان _id به‌روز می‌شوند{"\n"}
          # حالت replace: کل کالکشن پاک و دوباره پر می‌شود{"\n"}
          # کالکشن‌های backuphistories و adminauditlogs محافظت شده‌اند
        </pre>
      </section>
    </div>
  );
}
