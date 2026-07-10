"use client";

import { useTranslation } from "@/components/providers/LanguageProvider";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { DocumentDownload, DocumentUpload, Mobile } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminAndroidAppInfo } from "@/common/interfaces/admin";
import { formatBytes } from "@/common/utils/admin-format";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";

export function AdminAppPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AdminAndroidAppInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [versionName, setVersionName] = useState("1.0.0");
  const [versionCode, setVersionCode] = useState("1");
  const apkInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.fetchAdminAndroidAppInfo();
      setInfo(data);
      if (data.versionName) setVersionName(data.versionName);
      if (data.versionCode) setVersionCode(String(data.versionCode));
    } catch {
      showToast(t("auto.ka71dc361a6"), "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".apk")) {
      showToast(t("auto.k90cc4796a0"), "danger");
      return;
    }

    const code = Number(versionCode);
    if (!versionName.trim() || !Number.isFinite(code) || code < 1) {
      showToast(t("auto.ke3a45ec2b1"), "danger");
      return;
    }

    setUploading(true);
    try {
      const result = await adminApi.uploadAdminAndroidApk(file, versionName.trim(), code);
      setInfo(result);
      showToast(result.message || "APK آپلود شد", "success");
      void load();
    } catch {
      showToast(t("auto.k9f32c31735"), "danger");
    } finally {
      setUploading(false);
      if (apkInputRef.current) apkInputRef.current.value = "";
    }
  };

  if (loading && !info) {
    return <div className="glass h-64 animate-pulse rounded-2xl" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">{t("auto.k59143b1beb")}</h3>
        <p className="text-sm text-muted">
          آپلود APK برای صفحه دانلود عمومی — کاربران از pdesk.ir/download دریافت می‌کنند
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Mobile size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("auto.k7cbf71c995")}</h4>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.k33a6a5ceb6")}</dt>
              <dd>{info?.available ? "بله" : "خیر — APK آپلود نشده"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.k24f4ed36d2")}</dt>
              <dd dir="ltr">{info?.versionName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.kb1b7821949")}</dt>
              <dd>{info?.versionCode ? toPersianDigits(info.versionCode) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.k31414a116f")}</dt>
              <dd>{info?.byteSize ? formatBytes(info.byteSize) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.k9d25ee7ba9")}</dt>
              <dd>
                {info?.updatedAt
                  ? new Date(info.updatedAt).toLocaleString("fa-IR")
                  : "—"}
              </dd>
            </div>
          </dl>
          {info?.downloadUrl ? (
            <a
              href={info.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block"
            >
              <Button variant="secondary">
                <DocumentDownload size={18} />
                لینک مستقیم APK
              </Button>
            </a>
          ) : null}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <DocumentUpload size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("auto.k63ef300630")}</h4>
          </div>
          <p className="mb-4 text-sm text-muted">
            فایل release امضاشده را انتخاب کنید. پس از آپلود، لینک دانلود و نسخه صفحه عمومی
            به‌روز می‌شود.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">{t("auto.kbd5bbe028f")}</label>
              <input
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="1.0.1"
                dir="ltr"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">{t("auto.kc608e21a4b")}</label>
              <input
                value={versionCode}
                onChange={(e) => setVersionCode(e.target.value)}
                placeholder="2"
                inputMode="numeric"
                dir="ltr"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <input
            ref={apkInputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files?.[0])}
          />
          <Button
            className="mt-4"
            onPress={() => apkInputRef.current?.click()}
            isDisabled={uploading}
          >
            <DocumentUpload size={18} />
            {uploading ? "در حال آپلود…" : "انتخاب و آپلود APK"}
          </Button>
        </div>
      </section>
    </div>
  );
}
