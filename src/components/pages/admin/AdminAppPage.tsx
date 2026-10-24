"use client";

import { useTranslation } from "@/i18n";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { DocumentDownload, DocumentUpload, Mobile } from "iconsax-reactjs";

import * as adminApi from "@/common/api/admin";
import type { AdminAndroidAppInfo } from "@/common/interfaces/admin";
import { formatBytes } from "@/common/utils/admin-format";
import { toPersianDigits } from "@/common/utils";
import { showToast } from "@/common/utils/toast";
import { CHANGELOG_META } from "@/common/constants/app-version";
import { AdminReleaseNotesCard } from "./AdminReleaseNotesCard";

export function AdminAppPage() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AdminAndroidAppInfo | null>(null);
  const [stats, setStats] = useState<adminApi.AdminAndroidStats | null>(null);
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
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    const pull = () =>
      adminApi
        .fetchAdminAndroidStats()
        .then((data) => alive && setStats(data))
        .catch(() => undefined);
    void pull();
    const timer = window.setInterval(pull, 30_000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

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
      showToast(result.message || t("auto.k7432a63a84"), "success");
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
          {t("auto.k99da1e3a09")}
        </p>
      </div>


      {stats ? (
        <section className="glass rounded-2xl p-6">
          <h4 className="font-bold">{t("feat.adminApp.statsTitle")}</h4>
          <p className="mb-4 mt-1 text-xs text-muted">{t("feat.adminApp.statsHint")}</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: t("feat.adminApp.activeNow"), value: stats.activeNow, accent: true },
              { label: t("feat.adminApp.users"), value: stats.users },
              { label: t("feat.adminApp.active24h"), value: stats.active24h },
              { label: t("feat.adminApp.active7d"), value: stats.active7d },
              { label: t("feat.adminApp.active30d"), value: stats.active30d },
              { label: t("feat.adminApp.downloads"), value: stats.downloads.total },
              { label: t("feat.adminApp.downloads7"), value: stats.downloads.last7Days },
              { label: t("feat.adminApp.downloads30"), value: stats.downloads.last30Days },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border p-3 ${item.accent ? "border-accent/40 bg-accent/10" : "border-border/50 bg-surface-secondary"}`}
              >
                <p className="text-xs text-muted">{item.label}</p>
                <p className="mt-1 text-2xl font-extrabold">{toPersianDigits(item.value)}</p>
              </div>
            ))}
          </div>
          {stats.versions.length ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted">{t("feat.adminApp.versions")}</p>
              <div className="flex flex-wrap gap-2">
                {stats.versions.map((v) => (
                  <span key={v.version ?? "unknown"} className="rounded-full border border-border/60 px-3 py-1 text-xs" dir="auto">
                    {v.version ?? t("feat.adminApp.unknownVersion")} · {toPersianDigits(v.count)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <AdminReleaseNotesCard options={CHANGELOG_META.map((e) => ({ version: e.version, title: t(e.titleKey), items: e.itemKeys.map((k) => t(k)) }))} />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <Mobile size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("auto.k7cbf71c995")}</h4>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("auto.k33a6a5ceb6")}</dt>
              <dd>{info?.available ? t("common.yes") : t("auto.kc1aa6a8243")}</dd>
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
              className={buttonVariants({ className: "mt-6", variant: "secondary" })}
            >
              <DocumentDownload size={18} />
              {t("auto.k642acf2223")}
            </a>
          ) : null}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="mb-4 flex items-center gap-2">
            <DocumentUpload size={22} className="text-accent" variant="Bold" />
            <h4 className="font-bold">{t("auto.k63ef300630")}</h4>
          </div>
          <p className="mb-4 text-sm text-muted">
            {t("auto.k55adad0f50")}
            {t("auto.ke16710c005")}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-muted">{t("auto.kbd5bbe028f")}</label>
              <Input variant="secondary" aria-label="versionName" value={versionName} onChange={(e) => setVersionName(e.target.value)} placeholder="1.0.1" dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">{t("auto.kc608e21a4b")}</label>
              <Input variant="secondary" aria-label="versionCode" value={versionCode} onChange={(e) => setVersionCode(e.target.value)} placeholder="2" inputMode="numeric" dir="ltr" />
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
            {uploading ? t("auto.kb4444fd8b3") : t("auto.k3511a3a474")}
          </Button>
        </div>
      </section>
    </div>
  );
}
