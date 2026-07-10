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
      showToast(t("بارگذاری اطلاعات بکاپ ناموفق بود"), "danger");
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
      showToast(t("بکاپ به تلگرام ارسال شد"), "success");
      void load();
    } catch {
      showToast(t("اجرای بکاپ ناموفق بود"), "danger");
    } finally {
      setRunning(false);
    }
  };

  const downloadLocal = async () => {
    setRunning(true);
    try {
      await adminApi.downloadFullDatabaseExport(format);
      showToast(t("فایل ZIP دانلود شد"), "success");
    } catch {
      showToast(t("دانلود ناموفق بود"), "danger");
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
      showToast(t("بازیابی ZIP ناموفق بود"), "danger");
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
        <h3 className="text-lg font-bold">{t("بکاپ و خروجی")}</h3>
        <p className="text-sm text-muted">
          بکاپ خودکار، اجرای دستی، دانلود و بازیابی ZIP
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Timer1 size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("بکاپ زمان‌بندی‌شده")}</h4>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("زمان‌بندی")}</dt>
              <dd>{info?.schedule.description}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("منطقه زمانی")}</dt>
              <dd>{info?.schedule.timezone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("تلگرام")}</dt>
              <dd>{info?.telegram.enabled ? "فعال" : "غیرفعال"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("حداکثر حجم")}</dt>
              <dd>{formatBytes(info?.telegram.maxFileSizeBytes ?? 0)}</dd>
            </div>
          </dl>
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <CloudAdd size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("آخرین بکاپ موفق")}</h4>
          </div>
          {info?.lastRun ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("فایل")}</dt>
                <dd className="truncate font-mono text-xs">{info.lastRun.filename}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("کالکشن‌ها")}</dt>
                <dd>{toPersianDigits(info.lastRun.collections)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("اسناد")}</dt>
                <dd>{toPersianDigits(info.lastRun.documents)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("حجم")}</dt>
                <dd>{formatBytes(info.lastRun.byteSize)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted">{t("هنوز بکاپ موفقی ثبت نشده است.")}</p>
          )}
        </div>
      </section>

      <section className="glass rounded-2xl p-6">
        <h4 className="mb-4 font-bold">{t("عملیات")}</h4>
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
            <span className="text-sm text-muted">{t("فرمت خروجی:")}</span>
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
            <span className="text-sm text-muted">{t("حالت بازیابی:")}</span>
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
          <h4 className="font-bold">{t("تاریخچه بکاپ")}</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("زمان")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("منبع")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("وضعیت")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("کالکشن")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("اسناد")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("حجم")}</th>
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
        <h4 className="mb-2 font-bold text-sm">{t("راهنمای بازیابی")}</h4>
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
