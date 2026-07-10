"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { DocumentDownload, DocumentUpload, Eye } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type {
  AdminCollectionMeta,
  AdminCollectionPreview,
  AdminExportFormat,
  AdminImportMode,
} from "@/common/interfaces/admin";
import { formatBytes } from "@/common/utils/admin-format";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

const FORMATS: { value: AdminExportFormat; label: string; hint: string }[] = [
  {
    value: "ejson",
    label: "EJSON",
    hint: "سازگار با mongoimport --jsonArray",
  },
  { value: "json", label: "JSON", hint: "خوانا برای ویرایشگر" },
  { value: "csv", label: "CSV", hint: "اکسل / Google Sheets" },
];

export function AdminDatabasePage() {
  const { t } = useTranslation();
  const [collections, setCollections] = useState<AdminCollectionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);
  const [format, setFormat] = useState<AdminExportFormat>("ejson");
  const [preview, setPreview] = useState<AdminCollectionPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importMode, setImportMode] = useState<AdminImportMode>("merge");
  const [importTarget, setImportTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchAdminCollections();
      setCollections(data);
    } catch {
      showToast(t("auto.keb1c2bc865"), "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const exportOne = async (name: string) => {
    setExporting(name);
    try {
      await adminApi.downloadCollectionExport(name, format);
      showToast(`خروجی ${name} دانلود شد`, "success");
    } catch {
      showToast(t("auto.k72a0e2fd88"), "danger");
    } finally {
      setExporting(null);
    }
  };

  const exportAll = async () => {
    setExporting("__all__");
    try {
      await adminApi.downloadFullDatabaseExport(format);
      showToast(t("auto.k9bb1888eff"), "success");
    } catch {
      showToast(t("auto.k72a0e2fd88"), "danger");
    } finally {
      setExporting(null);
    }
  };

  const startImport = (name: string) => {
    setImportTarget(name);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file || !importTarget) return;
    setExporting(importTarget);
    try {
      const result = await adminApi.importCollectionJson(
        importTarget,
        file,
        importMode,
      );
      showToast(
        `${importTarget}: ${toPersianDigits(result.imported)} سند بازیابی شد`,
        "success",
      );
      void load();
    } catch {
      showToast(t("auto.k1732faa31d"), "danger");
    } finally {
      setExporting(null);
      setImportTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openPreview = async (name: string) => {
    setPreviewLoading(true);
    try {
      const data = await adminApi.fetchCollectionPreview(name, 15);
      setPreview(data);
    } catch {
      showToast(t("auto.k6ef0a02955"), "danger");
    } finally {
      setPreviewLoading(false);
    }
  };

  const totalDocs = collections.reduce((sum, c) => sum + c.documentCount, 0);
  const totalSize = collections.reduce(
    (sum, c) => sum + c.estimatedSizeBytes,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-lg font-bold">{t("auto.k9fe6d4a760")}</h3>
          <p className="text-sm text-muted">
            {toPersianDigits(collections.length)} کالکشن ·{" "}
            {toPersianDigits(totalDocs)} سند · {formatBytes(totalSize)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-border bg-surface p-1">
            {FORMATS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFormat(item.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  format === item.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Button
            onPress={() => void exportAll()}
            isDisabled={exporting !== null || loading}
          >
            <DocumentDownload size={18} />
            خروجی همه (ZIP)
          </Button>
        </div>
      </div>

      <p className="rounded-xl bg-surface-secondary/70 px-4 py-3 text-xs text-muted">
        فرمت فعال:{" "}
        <strong>{FORMATS.find((f) => f.value === format)?.label}</strong> —{" "}
        {FORMATS.find((f) => f.value === format)?.hint}
        {" · "}
        بازیابی:{" "}
        <strong>{importMode === "merge" ? "ادغام" : "جایگزینی"}</strong>
      </p>

      <div className="flex flex-wrap gap-2">
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => void handleImportFile(e.target.files?.[0])}
      />

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-secondary/70 text-muted">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k856205a73e")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k5b4218ff28")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k31414a116f")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.kf3de99e34e")}</th>
                <th className="px-4 py-3 text-start font-medium">{t("auto.k0f0dff2dfc")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    در حال بارگذاری…
                  </td>
                </tr>
              ) : (
                collections.map((collection) => (
                  <tr
                    key={collection.name}
                    className="border-t border-border/50 hover:bg-surface-secondary/40"
                  >
                    <td className="px-4 py-3 font-medium">{collection.name}</td>
                    <td className="px-4 py-3">
                      {toPersianDigits(collection.documentCount)}
                    </td>
                    <td className="px-4 py-3">
                      {formatBytes(collection.estimatedSizeBytes)}
                    </td>
                    <td className="px-4 py-3">
                      {toPersianDigits(collection.indexes)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => void openPreview(collection.name)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => startImport(collection.name)}
                          isDisabled={exporting !== null}
                        >
                          <DocumentUpload size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          isDisabled={exporting !== null}
                          onPress={() => void exportOne(collection.name)}
                        >
                          <DocumentDownload size={16} />
                          {exporting === collection.name ? "…" : "دانلود"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={Boolean(preview) || previewLoading}
        onOpenChange={() => setPreview(null)}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="max-w-3xl">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  پیش‌نمایش {preview?.name ?? "…"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {previewLoading ? (
                  <div className="h-40 animate-pulse rounded-xl bg-surface-secondary" />
                ) : preview ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      نمایش {toPersianDigits(preview.preview.length)} از{" "}
                      {toPersianDigits(preview.total)} سند
                    </p>
                    <pre className="max-h-[50vh] overflow-auto rounded-xl bg-surface-secondary p-4 text-xs leading-relaxed">
                      {JSON.stringify(preview.preview, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
