"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Modal, Tabs } from "@heroui/react";
import {
  Brush2,
  Clock,
  Crown,
  DocumentDownload,
  DocumentText,
  Lock1,
  Printer,
  RefreshLeftSquare,
  Save2,
  Star1,
  TableDocument,
  TickCircle,
  Trash,
} from "iconsax-reactjs";

import * as exportApi from "@/common/api/export-center";
import { PATHS } from "@/common/constants";
import { useHydratedSearchParams } from "@/common/hooks/useHydratedSearchParams";
import type {
  ExportCenterMeta,
  ExportFormat,
  ExportHistoryItem,
  ExportPresetItem,
  ExportPreview,
  ExportRangePreset,
  ExportSourceKey,
} from "@/common/interfaces/export-center.interface";
import {
  clearExportDraft,
  defaultBuilderState,
  defaultSourceRequest,
  EXPORT_BUNDLES,
  EXPORT_SOURCE_GROUPS,
  fromExportRequest,
  fromRangeValue,
  loadExportDraft,
  RANGE_PRESET_ORDER,
  saveExportDraft,
  toExportRequest,
  toRangeValue,
  type ExportBuilderState,
} from "@/common/utils/export-center";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { showToast } from "@/common/utils/toast";
import { AppSelect } from "@/components/common/form/AppControls";
import { FormDatePicker, FormInput } from "@/components/common/form/FormFields";
import { SwitchRow } from "@/components/common/form/FormKit";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";
import { CustomExportsPage } from "@/components/pages/exports/CustomExportsPage";
import { useTranslation } from "@/i18n";

import { ExportPreviewPanel } from "./ExportPreviewPanel";
import { ExportSourcePanel } from "./ExportSourcePanel";

type PageTab = "builder" | "saved" | "templates";

function Step({ index, title, hint, children, aside }: { index: number; title: string; hint?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border/60 bg-surface p-4 shadow-sm sm:p-5" aria-labelledby={`export-step-${index}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
            {toPersianDigits(index)}
          </span>
          <div className="min-w-0">
            <h2 id={`export-step-${index}`} className="font-bold">
              {title}
            </h2>
            {hint ? <p className="mt-0.5 text-xs leading-5 text-muted">{hint}</p> : null}
          </div>
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

const FORMAT_ICONS: Record<ExportFormat, typeof TableDocument> = {
  xlsx: TableDocument,
  csv: DocumentText,
  html: Printer,
};

export function ExportCenterPage() {
  const { t } = useTranslation();
  const { hydrated, get } = useHydratedSearchParams();
  const { isFeatureEnabled, data: subscriptionData } = useSubscriptionAccess();
  const [meta, setMeta] = useState<ExportCenterMeta | null>(null);
  const [metaError, setMetaError] = useState(false);
  const [state, setState] = useState<ExportBuilderState | null>(null);
  const [tab, setTab] = useState<PageTab>("builder");
  const [preview, setPreview] = useState<ExportPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewNonce, setPreviewNonce] = useState(0);
  const [downloading, setDownloading] = useState<null | "download" | "open">(null);
  const [presets, setPresets] = useState<ExportPresetItem[] | null>(null);
  const [history, setHistory] = useState<ExportHistoryItem[] | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | undefined>(undefined);
  const initialized = useRef(false);

  const loadMeta = useCallback(async () => {
    setMetaError(false);
    try {
      setMeta(await exportApi.fetchExportMeta());
    } catch {
      setMetaError(true);
    }
  }, []);

  const loadSaved = useCallback(async () => {
    try {
      const [nextPresets, nextHistory] = await Promise.all([exportApi.fetchExportPresets(), exportApi.fetchExportHistory()]);
      setPresets(nextPresets);
      setHistory(nextHistory);
    } catch {
      setPresets((current) => current ?? []);
      setHistory((current) => current ?? []);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
    void loadSaved();
  }, [loadMeta, loadSaved]);

  const defs = useMemo(() => meta?.sources ?? [], [meta]);
  const defByKey = useMemo(() => new Map(defs.map((def) => [def.key, def])), [defs]);

  // Start from the URL (links from the dashboard), else the saved draft, else defaults.
  useEffect(() => {
    if (!meta || !hydrated || initialized.current) return;
    initialized.current = true;
    const base = defaultBuilderState(meta.sources, meta.preferences);
    const draft = loadExportDraft();
    let next = draft ? fromExportRequest(toExportRequest(draft), draft.format, meta.sources, base) : base;
    const source = get("source") as ExportSourceKey;
    if (source && defByKey.has(source)) {
      const def = defByKey.get(source)!;
      const request = defaultSourceRequest(def);
      const filters = { ...(request.filters ?? {}) };
      const category = get("category");
      if (category && def.filters.includes("categories")) filters.categories = [category];
      const type = get("type");
      if (type === "0" && def.types?.some((item) => item.value === "income")) filters.type = "income";
      if (type === "1" && def.types?.some((item) => item.value === "expense")) filters.type = "expense";
      const q = get("q");
      if (q && def.filters.includes("q")) filters.q = q;
      next = { ...base, sources: [{ ...request, filters }] };
      const preset = get("preset") as ExportRangePreset;
      if (preset && RANGE_PRESET_ORDER.includes(preset))
        next.range = { preset, from: get("from"), to: get("to") };
    }
    setState(next);
  }, [defByKey, get, hydrated, meta]);

  useEffect(() => {
    if (state) saveExportDraft(state);
  }, [state]);

  const request = useMemo(() => (state ? toExportRequest(state) : null), [state]);
  const requestKey = useMemo(() => JSON.stringify(request), [request]);
  const lockedSelected = useMemo(
    () => (state?.sources ?? []).filter((source) => defByKey.get(source.key)?.available === false),
    [defByKey, state?.sources],
  );
  const blocked = !state
    ? null
    : state.sources.length === 0
      ? t("exports.preview.pickSource")
      : lockedSelected.length
        ? t("exports.preview.lockedSelected", { names: lockedSelected.map((source) => defByKey.get(source.key)?.label).join("، ") })
        : state.range.preset === "custom" && !state.range.from && !state.range.to
          ? t("exports.preview.pickDates")
          : null;

  // Live preview, debounced; stale responses are aborted.
  useEffect(() => {
    if (!request || blocked) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError(null);
      exportApi
        .fetchExportPreview(request, controller.signal)
        .then(setPreview)
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setPreviewError(error instanceof Error ? error.message : t("exports.preview.error"));
        })
        .finally(() => {
          if (!controller.signal.aborted) setPreviewLoading(false);
        });
    }, 700);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
    // requestKey captures every change of `request`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, blocked, previewNonce]);

  const update = useCallback((patch: Partial<ExportBuilderState>) => {
    setActivePresetId(undefined);
    setState((current) => (current ? { ...current, ...patch } : current));
  }, []);

  function toggleSource(key: ExportSourceKey) {
    if (!state) return;
    const def = defByKey.get(key);
    if (!def) return;
    const exists = state.sources.some((source) => source.key === key);
    update({
      sources: exists ? state.sources.filter((source) => source.key !== key) : [...state.sources, defaultSourceRequest(def)],
    });
  }

  function applyBundle(keys: ExportSourceKey[]) {
    if (!state) return;
    const available = keys.filter((key) => defByKey.get(key)?.available);
    update({
      sources: available.map(
        (key) => state.sources.find((source) => source.key === key) ?? defaultSourceRequest(defByKey.get(key)!),
      ),
    });
  }

  async function runDownload(mode: "download" | "open", override?: { state: ExportBuilderState; presetId?: string }) {
    const target = override?.state ?? state;
    if (!target || !meta) return;
    const body = toExportRequest(target);
    const format = mode === "open" ? "html" : target.format;
    // A window opened after an await is blocked as a popup, so open it now.
    const pending = mode === "open" ? window.open("", "_blank") : null;
    setDownloading(mode);
    try {
      const file = await exportApi.downloadExportFile(body, format, override?.presetId ?? activePresetId);
      if (pending) {
        pending.location.href = URL.createObjectURL(new Blob([file.blob], { type: "text/html" }));
      } else {
        exportApi.saveExportFile(file);
      }
      showToast(
        file.rows
          ? t("exports.download.success", { count: toPersianDigits(file.rows.toLocaleString("en-US")) })
          : t("exports.download.successEmpty"),
        "success",
      );
      void loadSaved();
    } catch (error) {
      pending?.close();
      showToast(error instanceof Error ? error.message : t("exports.download.error"));
    } finally {
      setDownloading(null);
    }
  }

  function applyPreset(preset: { config: ExportPresetItem["config"]; format: ExportFormat; _id?: string }, presetId?: string) {
    if (!meta || !state) return;
    const next = fromExportRequest(preset.config, preset.format, meta.sources, defaultBuilderState(meta.sources, meta.preferences));
    setState(next);
    setActivePresetId(presetId);
    setTab("builder");
    showToast(t("exports.saved.applied"), "success");
  }

  async function savePreset() {
    if (!state || !presetName.trim()) return;
    setSavingPreset(true);
    try {
      const saved = await exportApi.createExportPreset({ name: presetName.trim(), format: state.format, config: toExportRequest(state) });
      setActivePresetId(saved._id);
      setSaveOpen(false);
      setPresetName("");
      showToast(t("exports.saved.created"), "success");
      void loadSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setSavingPreset(false);
    }
  }

  async function toggleFavorite(preset: ExportPresetItem) {
    try {
      await exportApi.updateExportPreset(preset._id, {
        name: preset.name,
        description: preset.description,
        format: preset.format,
        favorite: !preset.favorite,
        config: preset.config,
      });
      void loadSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("common.error"));
    }
  }

  async function removePreset(preset: ExportPresetItem) {
    if (!window.confirm(t("exports.saved.deleteConfirm", { name: preset.name }))) return;
    try {
      await exportApi.deleteExportPreset(preset._id);
      void loadSaved();
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("common.error"));
    }
  }

  async function clearHistory() {
    if (!window.confirm(t("exports.saved.clearHistoryConfirm"))) return;
    try {
      await exportApi.clearExportHistory();
      setHistory([]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t("common.error"));
    }
  }

  function resetBuilder() {
    if (!meta) return;
    clearExportDraft();
    setActivePresetId(undefined);
    setState(defaultBuilderState(meta.sources, meta.preferences));
  }

  const formatDateTime = useCallback(
    (value?: string | null) => {
      if (!value) return "";
      const calendar = meta?.preferences.calendar === "gregorian" ? "gregory" : "persian";
      try {
        return new Intl.DateTimeFormat(`fa-IR-u-ca-${calendar}`, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
      } catch {
        return new Date(value).toLocaleString("fa-IR");
      }
    },
    [meta?.preferences.calendar],
  );

  const sourceNames = (keys: ExportSourceKey[]) => keys.map((key) => defByKey.get(key)?.label ?? key).join("، ");

  if (metaError) {
    return (
      <section className="mx-auto flex min-h-[360px] w-full max-w-2xl items-center justify-center rounded-3xl border border-border/60 bg-surface p-8 text-center">
        <div>
          <p className="text-lg font-bold">{t("exports.loadError")}</p>
          <Button className="mt-5" onPress={() => void loadMeta()}>
            {t("common.tryAgain")}
          </Button>
        </div>
      </section>
    );
  }

  if (!meta || !state) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="pb-shimmer h-20 rounded-3xl" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="pb-shimmer h-96 rounded-3xl" />
          <div className="pb-shimmer h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  const options = state.options;
  const hasSubscription = Boolean(subscriptionData?.subscription);
  const brandedEnabled = meta.features.brandedTemplates || isFeatureEnabled("custom_exports");
  const formats: Array<{ id: ExportFormat; label: string; hint: string }> = [
    { id: "xlsx", label: t("exports.format.xlsx"), hint: t("exports.format.xlsxHint") },
    { id: "csv", label: t("exports.format.csv"), hint: t("exports.format.csvHint") },
    { id: "html", label: t("exports.format.html"), hint: t("exports.format.htmlHint") },
  ];
  const canDownload = !blocked && downloading === null;

  const actions = (
    <div className="space-y-2">
      <Button fullWidth size="lg" isDisabled={!canDownload} isPending={downloading === "download"} onPress={() => void runDownload("download")}>
        <DocumentDownload size={20} />
        {t("exports.download.button", { format: formats.find((item) => item.id === state.format)?.label ?? "" })}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" isDisabled={!canDownload} isPending={downloading === "open"} onPress={() => void runDownload("open")}>
          <Printer size={17} />
          {t("exports.download.print")}
        </Button>
        <Button variant="secondary" isDisabled={!state.sources.length || Boolean(lockedSelected.length)} onPress={() => setSaveOpen(true)}>
          <Save2 size={17} />
          {t("exports.saved.saveButton")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<DocumentDownload size={24} variant="Bold" />}
        title={t("exports.title")}
        description={t("exports.description")}
        actions={
          <Button variant="ghost" size="sm" onPress={resetBuilder}>
            <RefreshLeftSquare size={17} />
            {t("exports.reset")}
          </Button>
        }
      />

      <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key) as PageTab)}>
        <Tabs.ListContainer>
          <Tabs.List aria-label={t("exports.title")}>
            <Tabs.Tab id="builder">
              {t("exports.tabs.builder")}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="saved">
              {t("exports.tabs.saved")}
              {presets?.length ? <span className="ms-1 text-xs text-muted">{toPersianDigits(presets.length)}</span> : null}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="templates">
              {t("exports.tabs.templates")}
              {!brandedEnabled ? <Lock1 size={13} className="ms-1 text-muted" /> : null}
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="builder" className="pt-5">
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]">
            <div className="min-w-0 space-y-5">
              <Step
                index={1}
                title={t("exports.steps.sources")}
                hint={t("exports.steps.sourcesHint")}
              >
                <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t("exports.bundles.title")}>
                  {EXPORT_BUNDLES.map((bundle) => (
                    <button
                      key={bundle.id}
                      type="button"
                      className="min-h-9 rounded-full border border-dashed border-accent/40 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10"
                      onClick={() => applyBundle(bundle.keys)}
                    >
                      {t(bundle.labelKey)}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  {EXPORT_SOURCE_GROUPS.map((group) => (
                    <div key={group.titleKey} className="space-y-2">
                      <p className="text-xs font-semibold text-muted">{t(group.titleKey)}</p>
                      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                        {group.keys.map((key) => {
                          const def = defByKey.get(key);
                          if (!def) return null;
                          const selected = state.sources.some((source) => source.key === key);
                          if (!def.available) {
                            return (
                              <Link
                                key={key}
                                href={PATHS.PLANS}
                                className="flex items-start gap-3 rounded-2xl border border-border/60 bg-surface-secondary/40 p-3 text-start opacity-80 hover:border-warning/60"
                              >
                                <Lock1 size={20} className="mt-0.5 shrink-0 text-warning" variant="Bold" />
                                <span className="min-w-0">
                                  <span className="block text-sm font-semibold">{def.label}</span>
                                  <span className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">{t("exports.sources.lockedHint")}</span>
                                </span>
                              </Link>
                            );
                          }
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleSource(key)}
                              className={`flex items-start gap-3 rounded-2xl border p-3 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                                selected ? "border-accent bg-accent/8" : "border-border/60 bg-surface hover:border-accent/40"
                              }`}
                            >
                              <TickCircle
                                size={20}
                                variant={selected ? "Bold" : "Linear"}
                                className={`mt-0.5 shrink-0 ${selected ? "text-accent" : "text-muted"}`}
                              />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold">{def.label}</span>
                                <span className="mt-0.5 hidden text-xs leading-5 text-muted sm:block">{def.description}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {!hasSubscription || defs.some((def) => !def.available) ? (
                  <p className="mt-4 flex items-center gap-2 text-xs text-muted">
                    <Crown size={15} className="text-warning" variant="Bold" />
                    {t("exports.sources.upgradeHint")}{" "}
                    <Link href={PATHS.PLANS} className="font-semibold text-accent">
                      {t("exports.sources.upgradeLink")}
                    </Link>
                  </p>
                ) : null}
              </Step>

              <Step index={2} title={t("exports.steps.range")} hint={t("exports.steps.rangeHint")}>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("exports.steps.range")}>
                  {RANGE_PRESET_ORDER.map((preset) => {
                    const active = state.range.preset === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => update({ range: { ...state.range, preset } })}
                        className={`min-h-9 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface-secondary hover:border-accent/50"
                        }`}
                      >
                        {meta.rangePresets[preset]}
                      </button>
                    );
                  })}
                </div>
                {state.range.preset === "custom" ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <FormDatePicker
                      label={t("exports.range.from")}
                      {...fromRangeValue(state.range.from)}
                      calendarType={options.calendar}
                      onChange={(parts) => update({ range: { ...state.range, from: toRangeValue(parts) } })}
                    />
                    <FormDatePicker
                      label={t("exports.range.to")}
                      {...fromRangeValue(state.range.to)}
                      calendarType={options.calendar}
                      onChange={(parts) => update({ range: { ...state.range, to: toRangeValue(parts) } })}
                    />
                    <p className="text-xs leading-5 text-muted sm:col-span-2">{t("exports.range.customHint")}</p>
                  </div>
                ) : null}
                {preview && !blocked ? (
                  <p className="mt-3 text-xs text-muted">
                    {t("exports.range.resolved")} <strong className="text-foreground">{preview.rangeLabel}</strong>
                  </p>
                ) : null}
              </Step>

              <Step
                index={3}
                title={t("exports.steps.settings")}
                hint={t("exports.steps.settingsHint")}
              >
                {state.sources.length === 0 ? (
                  <p className="rounded-2xl bg-surface-secondary p-4 text-center text-sm text-muted">{t("exports.preview.pickSource")}</p>
                ) : (
                  <div className="space-y-3">
                    {state.sources.map((source, index) => {
                      const def = defByKey.get(source.key);
                      if (!def) return null;
                      return (
                        <ExportSourcePanel
                          key={source.key}
                          def={def}
                          meta={meta}
                          value={source}
                          defaultOpen={index === 0 && state.sources.length === 1}
                          onChange={(next) =>
                            update({ sources: state.sources.map((item) => (item.key === source.key ? next : item)) })
                          }
                          onRemove={() => toggleSource(source.key)}
                        />
                      );
                    })}
                  </div>
                )}
              </Step>

              <Step index={4} title={t("exports.steps.output")} hint={t("exports.steps.outputHint")}>
                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t("exports.steps.output")}>
                  {formats.map((format) => {
                    const Icon = FORMAT_ICONS[format.id];
                    const active = state.format === format.id;
                    return (
                      <button
                        key={format.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => update({ format: format.id })}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-start transition-colors ${
                          active ? "border-accent bg-accent/8" : "border-border/60 bg-surface hover:border-accent/40"
                        }`}
                      >
                        <Icon size={22} variant={active ? "Bold" : "Linear"} className={active ? "text-accent" : "text-muted"} />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{format.label}</span>
                          <span className="mt-0.5 block text-xs leading-5 text-muted">{format.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <LabeledSelect
                    label={t("exports.options.calendar")}
                    value={options.calendar ?? meta.preferences.calendar}
                    options={[
                      { value: "jalali", label: t("exports.options.jalali") },
                      { value: "gregorian", label: t("exports.options.gregorian") },
                    ]}
                    onChange={(calendar) =>
                      update({
                        options: { ...options, calendar: calendar === "gregorian" ? "gregorian" : "jalali" },
                        // Custom dates were picked in the old calendar.
                        range: calendar !== options.calendar ? { ...state.range, from: "", to: "" } : state.range,
                      })
                    }
                  />
                  <LabeledSelect
                    label={t("exports.options.moneyUnit")}
                    value={options.moneyUnit ?? "toman"}
                    options={[
                      { value: "toman", label: t("exports.options.toman") },
                      { value: "rial", label: t("exports.options.rial") },
                    ]}
                    onChange={(moneyUnit) => update({ options: { ...options, moneyUnit: moneyUnit === "rial" ? "rial" : "toman" } })}
                  />
                  <LabeledSelect
                    label={t("exports.options.digits")}
                    value={options.digits ?? "fa"}
                    options={[
                      { value: "fa", label: t("exports.options.digitsFa") },
                      { value: "latin", label: t("exports.options.digitsLatin") },
                    ]}
                    onChange={(digits) => update({ options: { ...options, digits: digits === "latin" ? "latin" : "fa" } })}
                  />
                  <LabeledSelect
                    label={t("exports.options.dateStyle")}
                    value={options.dateStyle ?? "slash"}
                    options={[
                      { value: "slash", label: t("exports.options.dateSlash") },
                      { value: "dash", label: t("exports.options.dateDash") },
                      { value: "long", label: t("exports.options.dateLong") },
                    ]}
                    onChange={(dateStyle) =>
                      update({ options: { ...options, dateStyle: dateStyle === "dash" || dateStyle === "long" ? dateStyle : "slash" } })
                    }
                  />
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">{t("exports.options.moneyHint")}</p>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <SwitchRow
                    label={t("exports.options.thousands")}
                    selected={options.thousands !== false}
                    onChange={(thousands) => update({ options: { ...options, thousands } })}
                  />
                  <SwitchRow
                    label={t("exports.options.showCurrency")}
                    selected={options.showCurrency === true}
                    onChange={(showCurrency) => update({ options: { ...options, showCurrency } })}
                  />
                  <SwitchRow
                    label={t("exports.options.summary")}
                    description={t("exports.options.summaryHint")}
                    selected={options.includeSummary !== false}
                    onChange={(includeSummary) => update({ options: { ...options, includeSummary } })}
                  />
                  <SwitchRow
                    label={t("exports.options.totals")}
                    description={t("exports.options.totalsHint")}
                    selected={options.includeTotals !== false}
                    onChange={(includeTotals) => update({ options: { ...options, includeTotals } })}
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <FormInput
                    label={t("exports.options.title")}
                    placeholder={preview?.title ?? t("exports.options.titlePlaceholder")}
                    value={options.title ?? ""}
                    maxLength={120}
                    onChange={(event) => update({ options: { ...options, title: event.target.value } })}
                  />
                  {brandedEnabled && meta.templates.length ? (
                    <LabeledSelect
                      label={t("exports.options.template")}
                      value={options.templateId ?? ""}
                      options={[{ value: "", label: t("exports.options.noTemplate") }, ...meta.templates.map((item) => ({ value: item._id, label: item.name }))]}
                      onChange={(templateId) => update({ options: { ...options, templateId: templateId || undefined } })}
                    />
                  ) : (
                    <p className="self-end rounded-xl bg-surface-secondary p-3 text-xs leading-5 text-muted">
                      <Brush2 size={14} className="me-1 inline" />
                      {brandedEnabled ? t("exports.options.noTemplatesYet") : t("exports.options.templateLocked")}
                    </p>
                  )}
                </div>
              </Step>
            </div>

            <aside className="min-w-0 space-y-4 xl:sticky xl:top-4">
              <div className="rounded-3xl border border-border/60 bg-surface p-4 shadow-sm">
                <ExportPreviewPanel
                  preview={blocked ? null : preview}
                  loading={previewLoading}
                  error={previewError}
                  blocked={blocked}
                  onRefresh={() => setPreviewNonce((value) => value + 1)}
                />
              </div>
              <div className="hidden rounded-3xl border border-border/60 bg-surface p-4 shadow-sm lg:block">
                {actions}
                <p className="mt-3 text-[11px] leading-5 text-muted">
                  {t("exports.download.limits", {
                    perSource: toPersianDigits(meta.limits.perSource.toLocaleString("en-US")),
                  })}
                </p>
              </div>
            </aside>
          </div>

          {/* Mobile: the download actions stick to the bottom while scrolling the builder. */}
          <div className="sticky bottom-0 z-30 -mx-2 mt-5 rounded-t-2xl border-t border-border/60 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
            {actions}
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="saved" className="space-y-6 pt-5">
          <section className="space-y-3">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold">{t("exports.saved.presetsTitle")}</h2>
                <p className="text-xs text-muted">{t("exports.saved.presetsHint")}</p>
              </div>
            </header>
            {presets === null ? (
              <div className="pb-shimmer h-24 rounded-2xl" />
            ) : presets.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">{t("exports.saved.noPresets")}</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {presets.map((preset) => (
                  <article key={preset._id} className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold">{preset.name}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {sourceNames((preset.config.sources ?? []).map((source) => source.key))}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {meta.rangePresets[preset.config.range?.preset ?? "all"]} · {formats.find((item) => item.id === preset.format)?.label}
                          {preset.lastUsedAt ? ` · ${t("exports.saved.lastUsed", { date: formatDateTime(preset.lastUsedAt) })}` : ""}
                        </p>
                      </div>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={preset.favorite ? t("exports.saved.unfavorite") : t("exports.saved.favorite")}
                        aria-pressed={preset.favorite}
                        onPress={() => void toggleFavorite(preset)}
                      >
                        <Star1 size={18} variant={preset.favorite ? "Bold" : "Linear"} className={preset.favorite ? "text-warning" : "text-muted"} />
                      </Button>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        isPending={downloading !== null}
                        onPress={() =>
                          void runDownload("download", {
                            state: fromExportRequest(preset.config, preset.format, meta.sources, defaultBuilderState(meta.sources, meta.preferences)),
                            presetId: preset._id,
                          })
                        }
                      >
                        <DocumentDownload size={16} />
                        {t("exports.saved.downloadNow")}
                      </Button>
                      <Button size="sm" variant="secondary" onPress={() => applyPreset(preset, preset._id)}>
                        {t("exports.saved.edit")}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger" onPress={() => void removePreset(preset)}>
                        <Trash size={16} />
                        {t("exports.saved.delete")}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold">{t("exports.saved.historyTitle")}</h2>
                <p className="text-xs text-muted">{t("exports.saved.historyHint")}</p>
              </div>
              {history?.length ? (
                <Button size="sm" variant="ghost" onPress={() => void clearHistory()}>
                  {t("exports.saved.clearHistory")}
                </Button>
              ) : null}
            </header>
            {history === null ? (
              <div className="pb-shimmer h-24 rounded-2xl" />
            ) : history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">{t("exports.saved.noHistory")}</p>
            ) : (
              <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-surface">
                {history.map((item) => (
                  <li key={item._id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                    <Clock size={18} className="shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{sourceNames(item.sources)}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatDateTime(item.createdAt)} · {item.rangeLabel} · {formats.find((format) => format.id === item.format)?.label} ·{" "}
                        {t("exports.preview.rows", { count: toPersianDigits(item.rowCount.toLocaleString("en-US")) })}
                        {item.truncated ? ` · ${t("exports.saved.truncated")}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="secondary" onPress={() => applyPreset({ config: item.config, format: item.format })}>
                        {t("exports.saved.reuse")}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        isPending={downloading !== null}
                        aria-label={t("exports.saved.redownload")}
                        onPress={() =>
                          void runDownload("download", {
                            state: fromExportRequest(item.config, item.format, meta.sources, defaultBuilderState(meta.sources, meta.preferences)),
                          })
                        }
                      >
                        <DocumentDownload size={16} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Tabs.Panel>

        <Tabs.Panel id="templates" className="pt-5">
          {brandedEnabled ? (
            <CustomExportsPage embedded />
          ) : (
            <section className="mx-auto max-w-2xl rounded-3xl border border-accent/20 bg-surface p-6 text-center sm:p-8">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
                <Brush2 size={28} variant="Bold" />
              </div>
              <h2 className="mt-4 text-lg font-bold">{t("exports.templates.lockedTitle")}</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">{t("exports.templates.lockedBody")}</p>
              <Link
                href={PATHS.PLANS}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground"
              >
                <Crown size={18} variant="Bold" />
                {t("common.subscription.compareAndUpgrade")}
              </Link>
            </section>
          )}
        </Tabs.Panel>
      </Tabs>

      <AppModal open={saveOpen} onOpenChange={setSaveOpen} size="sm">
        <AppModalDialog>
          <AppModalHeader>
            <Modal.Heading>{t("exports.saved.saveTitle")}</Modal.Heading>
          </AppModalHeader>
          <Modal.Body className="space-y-3">
            <p className="text-sm leading-6 text-muted">{t("exports.saved.saveHint")}</p>
            <FormInput
              label={t("exports.saved.name")}
              value={presetName}
              maxLength={80}
              autoFocus
              placeholder={t("exports.saved.namePlaceholder")}
              onChange={(event) => setPresetName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void savePreset();
              }}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onPress={() => setSaveOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button isDisabled={!presetName.trim()} isPending={savingPreset} onPress={() => void savePreset()}>
              <Save2 size={17} />
              {t("exports.saved.saveButton")}
            </Button>
          </Modal.Footer>
        </AppModalDialog>
      </AppModal>
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <AppSelect ariaLabel={label} value={value} options={options} onChange={onChange} />
    </div>
  );
}
