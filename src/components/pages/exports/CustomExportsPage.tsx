"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { Add, ArrangeVertical, ArrowLeft2, Brush2, Crown, DocumentDownload, DocumentUpload, Edit2, Eye, GalleryAdd, Lock1, Save2, Trash } from "iconsax-reactjs";
import Image from "next/image";

import { useTranslation } from "@/components/providers/LanguageProvider";
import { useSubscriptionAccess } from "@/components/providers/SubscriptionAccessProvider";
import * as exportsApi from "@/common/api/custom-exports";
import type { ExportCanvasElement, ExportColumn, ExportField, ExportSource, ExportTemplate } from "@/common/interfaces/export-template.interface";
import { showToast } from "@/common/utils/toast";
import { formatPrice } from "@/common/utils";
import { PATHS } from "@/common/constants";
import { FormSelect } from "@/components/common/form/FormFields";

type Draft = Omit<ExportTemplate, "_id" | "user">;

const colors = { rose: "#e11d48", ink: "#0f172a", paper: "#ffffff" };

function HeroInput({ label, value, onChange, type = "text", placeholder, className = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; className?: string }) {
  return <TextField className={`gap-1.5 ${className}`}><Label className="text-sm font-medium">{label}</Label><Input variant="secondary" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></TextField>;
}

function LockedExportsState({ hasSubscription }: { hasSubscription: boolean }) {
  const { t } = useTranslation();
  return <section className="glass mx-auto flex min-h-[460px] w-full max-w-3xl items-center justify-center rounded-3xl border border-accent/20 p-8 text-center shadow-sm sm:p-12"><div className="max-w-xl"><div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-accent/12 text-accent"><Lock1 size={32} variant="Bold" /></div><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{t("common.subscription.currentPlan")}</p><h1 className="mt-2 text-2xl font-bold tracking-tight">{t("pages.customExports.title")}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted">{hasSubscription ? t("common.subscription.notForYourPlan") : t("common.subscription.contactAdminToActivate")}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button onPress={() => { window.location.href = PATHS.PLANS; }}><Crown size={18} variant="Bold" />{t("common.subscription.viewPlans")}</Button><Button variant="secondary" onPress={() => { window.location.href = `${PATHS.LANDING}#contact`; }}><ArrowLeft2 size={17} />{t("common.subscription.contactAdmin")}</Button></div></div></section>;
}

function ExportLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return <section className="glass mx-auto flex min-h-[360px] w-full max-w-2xl items-center justify-center rounded-3xl p-8 text-center"><div><p className="text-lg font-bold">{t("pages.customExports.loadError")}</p><p className="mt-2 text-sm text-muted">{t("common.tryAgain")}</p><Button className="mt-5" onPress={onRetry}>{t("common.tryAgain")}</Button></div></section>;
}

function makeDraft(source: ExportSource, fields: ExportField[]): Draft {
  const chosen = fields.filter((field) => ["date", "amount", "type", "category", "description"].includes(field.key));
  return {
    name: "گزارش شرکت",
    description: "قالب اختصاصی گزارش",
    source,
    columns: chosen.map((field, index) => ({ id: `${field.key}-${index}`, key: field.key, label: field.label, enabled: true, order: index, width: field.key === "description" ? 260 : 130, format: field.format })),
    branding: { title: "گزارش مالی شرکت", subtitle: "گزارش اختصاصی", primaryColor: colors.rose, textColor: colors.ink, backgroundColor: colors.paper, footer: "تولیدشده با میز پردیس", logoDataUrl: "" },
    canvas: { width: 900, height: 360, backgroundColor: colors.paper, elements: [
      { id: "title", type: "text", x: 32, y: 28, width: 500, height: 58, text: "گزارش مالی شرکت", fontSize: 28, color: colors.ink, fill: "transparent", bold: true, align: "right", radius: 0, opacity: 1 },
      { id: "date", type: "field", x: 32, y: 105, width: 250, height: 45, field: "date", text: "", fontSize: 18, color: colors.rose, fill: "#fff1f2", bold: true, align: "right", radius: 12, opacity: 1 },
      { id: "accent", type: "shape", x: 32, y: 190, width: 836, height: 10, text: "", fontSize: 1, color: colors.rose, fill: colors.rose, bold: false, align: "right", radius: 5, opacity: 1 },
    ] },
    importedHeaders: [],
    importMapping: {},
    favorite: false,
  };
}

function FieldPicker({ fields, columns, onChange }: { fields: ExportField[]; columns: ExportColumn[]; onChange: (columns: ExportColumn[]) => void }) {
  const { t } = useTranslation();
  const selectedKeys = new Set(columns.map((column) => column.key));
  function toggle(field: ExportField) {
    if (selectedKeys.has(field.key)) onChange(columns.filter((column) => column.key !== field.key));
    else onChange([...columns, { id: `${field.key}-${columns.length}`, key: field.key, label: field.label, enabled: true, order: columns.length, width: field.key === "description" ? 260 : 130, format: field.format }]);
  }
  return <div className="space-y-4"><div className="flex flex-wrap gap-2">{fields.map((field) => <Button key={field.key} size="sm" variant={selectedKeys.has(field.key) ? "secondary" : "ghost"} onPress={() => toggle(field)}>{selectedKeys.has(field.key) ? "✓ " : "+ "}{field.label}</Button>)}</div><div className="space-y-2">{[...columns].sort((a, b) => a.order - b.order).map((column, index) => <div key={column.id} className="grid grid-cols-[auto_minmax(0,1fr)_110px_auto] items-center gap-2 rounded-2xl border border-border/60 bg-surface-secondary/30 p-3"><ArrangeVertical size={16} className="text-muted" /><Input aria-label={column.label} variant="secondary" value={column.label} onChange={(e) => onChange(columns.map((item) => item.id === column.id ? { ...item, label: e.target.value } : item))} /><Input aria-label={t("pages.customExports.columns")} variant="secondary" type="number" value={String(column.width)} onChange={(e) => onChange(columns.map((item) => item.id === column.id ? { ...item, width: Math.max(40, Number(e.target.value) || 40) } : item))} /><Button size="sm" variant="ghost" className="text-danger" onPress={() => onChange(columns.filter((item) => item.id !== column.id))} aria-label={t("pages.customExports.removeField")}><Trash size={16} /></Button><input type="hidden" value={index} readOnly /></div>)}</div></div>;
}

function CanvasEditor({ canvas, fields, onChange }: { canvas: Draft["canvas"]; fields: ExportField[]; onChange: (canvas: Draft["canvas"]) => void }) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(canvas.elements[0]?.id ?? null);
  const dragRef = useRef<{ id: string; x: number; y: number; pointerX: number; pointerY: number } | null>(null);
  const selected = canvas.elements.find((element) => element.id === selectedId);
  function updateElement(id: string, patch: Partial<ExportCanvasElement>) {
    onChange({ ...canvas, elements: canvas.elements.map((element) => element.id === id ? { ...element, ...patch } : element) });
  }
  function add(type: ExportCanvasElement["type"]) {
    const id = `${type}-${Date.now()}`;
    const item: ExportCanvasElement = { id, type, x: 90, y: 240, width: type === "shape" ? 260 : 220, height: 54, text: type === "text" ? "متن جدید" : "", field: type === "field" ? fields[0]?.key ?? "date" : "", fontSize: 18, color: "#0f172a", fill: type === "shape" ? "#ffe4e6" : "#f8fafc", bold: type === "text", align: "right", radius: 12, opacity: 1 };
    onChange({ ...canvas, elements: [...canvas.elements, item] }); setSelectedId(id);
  }
  return <div className="space-y-3"><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onPress={() => add("text")}><Add size={15} />{t("pages.customExports.addText")}</Button><Button size="sm" variant="secondary" onPress={() => add("field")}><Add size={15} />{t("pages.customExports.addFieldElement")}</Button><Button size="sm" variant="secondary" onPress={() => add("shape")}><Add size={15} />{t("pages.customExports.addShape")}</Button></div><div className="overflow-auto rounded-2xl border border-border bg-slate-100 p-4 dark:bg-slate-900"><div className="relative mx-auto shadow-xl" style={{ width: canvas.width, height: canvas.height, background: canvas.backgroundColor, maxWidth: "100%", minWidth: Math.min(canvas.width, 520) }} onPointerMove={(event) => { const drag = dragRef.current; if (!drag) return; updateElement(drag.id, { x: Math.max(0, Math.min(canvas.width - (selected?.width ?? 100), drag.x + event.clientX - drag.pointerX)), y: Math.max(0, Math.min(canvas.height - (selected?.height ?? 50), drag.y + event.clientY - drag.pointerY)) }); }} onPointerUp={() => { dragRef.current = null; }} onPointerLeave={() => { dragRef.current = null; }}>{canvas.elements.map((element) => <button type="button" key={element.id} onClick={() => setSelectedId(element.id)} onPointerDown={(event) => { event.preventDefault(); setSelectedId(element.id); dragRef.current = { id: element.id, x: element.x, y: element.y, pointerX: event.clientX, pointerY: event.clientY }; }} className={`absolute overflow-hidden border p-2 text-start ${selectedId === element.id ? "border-accent ring-2 ring-accent/25" : "border-transparent"}`} style={{ left: element.x, top: element.y, width: element.width, height: element.height, color: element.color, background: element.type === "shape" ? element.fill : element.fill === "transparent" ? "transparent" : element.fill, fontSize: element.fontSize, fontWeight: element.bold ? 700 : 400, textAlign: element.align, borderRadius: element.radius, opacity: element.opacity }}>{element.type === "field" ? `{{${element.field}}}` : element.type === "shape" ? "" : element.text}</button>)}</div></div>{selected && <div className="grid gap-3 rounded-2xl border border-border bg-surface-secondary/40 p-4 sm:grid-cols-2"><p className="col-span-full text-xs font-semibold text-muted">{t("pages.customExports.selectedElement")}</p>{selected.type === "field" ? <FormSelect label={t("pages.customExports.addFieldElement")} selectedKey={selected.field} onSelectionChange={(key) => updateElement(selected.id, { field: key })} options={fields.map((field) => ({ id: field.key, label: field.label }))} /> : <HeroInput label={t("pages.customExports.addText")} value={selected.text ?? ""} onChange={(value) => updateElement(selected.id, { text: value })} placeholder={t("pages.customExports.addText")} />}<HeroInput label={t("pages.customExports.selectedElement")} type="number" value={String(selected.fontSize ?? 18)} onChange={(value) => updateElement(selected.id, { fontSize: Number(value) || 18 })} /><label className="text-xs font-medium text-muted">{t("pages.customExports.primaryColor")}<input type="color" value={selected.color ?? "#0f172a"} onChange={(e) => updateElement(selected.id, { color: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-border bg-surface p-1" /></label><Button size="sm" variant="ghost" className="text-danger" onPress={() => { onChange({ ...canvas, elements: canvas.elements.filter((element) => element.id !== selected.id) }); setSelectedId(null); }}><Trash size={15} />{t("pages.customExports.removeField")}</Button></div>}</div>;
}

function Preview({ draft }: { draft: Draft }) {
  const first = { date: "۱۴۰۵/۰۱/۰۱", amount: 1250000, type: "هزینه", category: "خدمات", description: "نمونه گزارش" } as Record<string, string | number>;
  return <div className="overflow-auto rounded-2xl border border-border bg-slate-100 p-4"><div className="mx-auto min-w-[620px] max-w-4xl bg-white p-6 text-slate-900 shadow-lg" style={{ borderTop: `6px solid ${draft.branding.primaryColor}`, background: draft.branding.backgroundColor }}><div className="flex items-center gap-3 border-b border-slate-200 pb-4">{draft.branding.logoDataUrl && <Image src={draft.branding.logoDataUrl} alt="" width={48} height={48} unoptimized className="h-12 w-12 object-contain" />}<div><h3 className="text-xl font-bold" style={{ color: draft.branding.primaryColor }}>{draft.branding.title}</h3><p className="text-sm text-slate-500">{draft.branding.subtitle}</p></div></div><div className="relative mx-auto my-5" style={{ width: draft.canvas.width, height: Math.min(draft.canvas.height, 280), maxWidth: "100%", background: draft.canvas.backgroundColor }}>{draft.canvas.elements.map((element) => <div key={element.id} className="absolute overflow-hidden p-2" style={{ left: element.x, top: element.y, width: element.width, height: element.height, color: element.color, background: element.type === "shape" ? element.fill : element.fill, fontSize: element.fontSize, fontWeight: element.bold ? 700 : 400, textAlign: element.align, borderRadius: element.radius, opacity: element.opacity }}>{element.type === "field" ? first[element.field ?? ""] ?? "—" : element.type === "shape" ? "" : element.text}</div>)}</div><table className="w-full border-collapse text-right text-xs"><thead><tr>{draft.columns.filter((column) => column.enabled).sort((a, b) => a.order - b.order).map((column) => <th key={column.id} className="border px-2 py-2 text-white" style={{ background: draft.branding.primaryColor }}>{column.label}</th>)}</tr></thead><tbody><tr>{draft.columns.filter((column) => column.enabled).sort((a, b) => a.order - b.order).map((column) => <td key={column.id} className="border px-2 py-2">{column.key === "amount" ? formatPrice(Number(first[column.key] ?? 0)) : first[column.key] ?? "—"}</td>)}</tr></tbody></table><p className="mt-4 text-xs text-slate-500">{draft.branding.footer}</p></div></div>;
}

export function CustomExportsPage() {
  const { t } = useTranslation();
  const { data: subscriptionData, loading: subscriptionLoading } = useSubscriptionAccess();
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [fields, setFields] = useState<ExportField[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"fields" | "design" | "preview">("fields");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const hasSubscription = Boolean(subscriptionData?.subscription);
  const hasAccess = Boolean(hasSubscription && subscriptionData?.entitlements.custom_exports?.enabled);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try { const [nextTemplates, nextFields] = await Promise.all([exportsApi.fetchExportTemplates(), exportsApi.fetchExportFields("budgets")]); setTemplates(nextTemplates); setFields(nextFields); } catch { setLoadError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (subscriptionLoading) return;
    if (!hasAccess) { setLoading(false); return; }
    void load();
  }, [hasAccess, load, subscriptionLoading]);

  async function selectSource(source: ExportSource) {
    const nextFields = await exportsApi.fetchExportFields(source);
    setFields(nextFields);
    setDraft((current) => current ? { ...current, source, columns: current.columns.filter((column) => nextFields.some((field) => field.key === column.key)) } : makeDraft(source, nextFields));
  }
  function startNew() { setEditingId(null); setDraft(makeDraft("budgets", fields)); setTab("fields"); }
  function edit(template: ExportTemplate) { setEditingId(template._id); setDraft({ name: template.name, description: template.description, source: template.source, columns: template.columns.map((column) => ({ ...column })), branding: { ...template.branding }, canvas: { ...template.canvas, elements: template.canvas.elements.map((element) => ({ ...element })) }, importedHeaders: template.importedHeaders, importMapping: template.importMapping, favorite: template.favorite }); setTab("fields"); void selectSource(template.source); }
  async function save() { if (!draft?.name.trim()) return; try { const saved = editingId ? await exportsApi.updateExportTemplate(editingId, draft) : await exportsApi.createExportTemplate(draft); setEditingId(saved._id); setDraft({ ...draft, ...saved }); await load(); showToast(t("pages.customExports.saved"), "success"); } catch { showToast(t("pages.customExports.saveError"), "danger"); } }
  async function remove() { if (!editingId || !window.confirm(t("pages.customExports.deleteConfirm"))) return; try { await exportsApi.deleteExportTemplate(editingId); setEditingId(null); setDraft(null); await load(); } catch { showToast(t("common.error"), "danger"); } }
  async function inspect(file: File) { setInspecting(true); try { const result = await exportsApi.inspectExportExcel(file); setDraft((current) => current ? { ...current, importedHeaders: result.headers, importMapping: Object.fromEntries(result.headers.map((header) => [header, ""])) } : current); showToast(`${result.headers.length} ${t("pages.customExports.importedHeaders")}`, "success"); } catch { showToast(t("common.error"), "danger"); } finally { setInspecting(false); } }
  function applyImportedMapping() {
    if (!draft) return;
    const mapped: ExportColumn[] = [];
    draft.importedHeaders.forEach((header, index) => {
      const key = draft.importMapping[header];
      const field = fields.find((item) => item.key === key);
      if (field) mapped.push({ id: `${field.key}-${index}`, key: field.key, label: header, sourceHeader: header, enabled: true, order: index, width: field.key === "description" ? 260 : 140, format: field.format });
    });
    if (!mapped.length) return;
    setDraft({ ...draft, columns: mapped });
    setTab("preview");
    showToast(t("pages.customExports.mappingApplied"), "success");
  }
  const selected = draft?.columns ?? [];

  if (subscriptionLoading) return <div className="glass mx-auto h-80 w-full max-w-3xl animate-pulse rounded-3xl bg-surface-secondary" aria-hidden="true" />;
  if (!hasAccess) return <LockedExportsState hasSubscription={hasSubscription} />;
  if (loadError) return <ExportLoadError onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Brush2 size={24} className="text-accent" variant="Bold" />{t("pages.customExports.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t("pages.customExports.description")}</p>
        </div>
        <Button onPress={startNew}><Add size={18} />{t("pages.customExports.newTemplate")}</Button>
      </header>

      {loading ? <div className="glass h-48 animate-pulse rounded-2xl" /> : (
        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="glass space-y-3 rounded-2xl p-4">
            <div className="flex items-center justify-between"><h2 className="font-bold">{t("pages.customExports.templates")}</h2><Button size="sm" variant="ghost" onPress={startNew} aria-label={t("pages.customExports.newTemplate")}><Add size={18} /></Button></div>
            {templates.length === 0 ? <p className="rounded-xl bg-surface-secondary p-3 text-sm text-muted">{t("pages.customExports.noTemplates")}</p> : templates.map((template) => (
              <Button type="button" key={template._id} onPress={() => edit(template)} variant="ghost" className={`h-auto w-full justify-start rounded-2xl border p-3 text-start ${editingId === template._id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}>
                <p className="font-semibold">{template.name}</p><p className="mt-1 text-xs text-muted">{template.columns.filter((column) => column.enabled).length} {t("pages.customExports.fieldsCount")} · {template.source}</p>
              </Button>
            ))}
          </aside>

          {draft ? (
            <main className="glass min-w-0 rounded-2xl p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                <HeroInput label={t("pages.customExports.templateName")} value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} placeholder={t("pages.customExports.templateName")} />
                <HeroInput className="md:col-span-2" label={t("pages.customExports.templateDescription")} value={draft.description} onChange={(value) => setDraft({ ...draft, description: value })} placeholder={t("pages.customExports.templateDescription")} />
                <FormSelect label={t("pages.customExports.source")} selectedKey={draft.source} onSelectionChange={(key) => void selectSource(key as ExportSource)} options={[{ id: "budgets", label: t("pages.customExports.sourceBudgets") }, { id: "debts", label: t("pages.customExports.sourceDebts") }, { id: "combined", label: t("pages.customExports.sourceCombined") }]} />
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-b border-border pb-3">
                <Button size="sm" variant={tab === "fields" ? "secondary" : "ghost"} onPress={() => setTab("fields")}><DocumentDownload size={16} />{t("pages.customExports.columns")}</Button>
                <Button size="sm" variant={tab === "design" ? "secondary" : "ghost"} onPress={() => setTab("design")}><Brush2 size={16} />{t("pages.customExports.canvas")}</Button>
                <Button size="sm" variant={tab === "preview" ? "secondary" : "ghost"} onPress={() => setTab("preview")}><Eye size={16} />{t("pages.customExports.preview")}</Button>
              </div>

              {tab === "fields" && <div className="mt-5 space-y-6">
                <div><h2 className="mb-3 font-bold">{t("pages.customExports.columns")}</h2><FieldPicker fields={fields} columns={selected} onChange={(columns) => setDraft({ ...draft, columns })} /></div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-border p-4"><h2 className="mb-3 font-bold">{t("pages.customExports.branding")}</h2><div className="space-y-3">
                    <HeroInput label={t("pages.customExports.reportTitle")} value={draft.branding.title} onChange={(value) => setDraft({ ...draft, branding: { ...draft.branding, title: value } })} placeholder={t("pages.customExports.reportTitle")} />
                    <HeroInput label={t("pages.customExports.reportSubtitle")} value={draft.branding.subtitle} onChange={(value) => setDraft({ ...draft, branding: { ...draft.branding, subtitle: value } })} placeholder={t("pages.customExports.reportSubtitle")} />
                    <div className="grid grid-cols-2 gap-2"><label className="text-xs text-muted">{t("pages.customExports.primaryColor")}<input type="color" value={draft.branding.primaryColor} onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding, primaryColor: e.target.value } })} className="mt-1 h-10 w-full rounded-lg border border-border" /></label><label className="text-xs text-muted">{t("pages.customExports.backgroundColor")}<input type="color" value={draft.branding.backgroundColor} onChange={(e) => setDraft({ ...draft, branding: { ...draft.branding, backgroundColor: e.target.value } })} className="mt-1 h-10 w-full rounded-lg border border-border" /></label></div>
                    <HeroInput label={t("pages.customExports.footer")} value={draft.branding.footer} onChange={(value) => setDraft({ ...draft, branding: { ...draft.branding, footer: value } })} placeholder={t("pages.customExports.footer")} />
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm"><GalleryAdd size={18} />{t("pages.customExports.uploadLogo")}<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setDraft({ ...draft, branding: { ...draft.branding, logoDataUrl: String(reader.result ?? "") } }); reader.readAsDataURL(file); }} /></label>
                  </div></div>
                  <div className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-2"><div><h2 className="font-bold">{t("pages.customExports.inspectExcel")}</h2><p className="mt-1 text-xs text-muted">{t("pages.customExports.excelHint")}</p></div><DocumentUpload size={20} className="text-accent" /></div>
                    <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-accent/40 bg-accent/5 p-5 text-sm text-accent">{inspecting ? t("common.loading") : t("pages.customExports.inspectExcel")}<input type="file" accept=".xlsx" className="hidden" disabled={inspecting} onChange={(e) => { const file = e.target.files?.[0]; if (file) void inspect(file); }} /></label>
                    {draft.importedHeaders.length > 0 && <div className="mt-4 space-y-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold">{t("pages.customExports.importedHeaders")}</p><Button size="sm" variant="secondary" onPress={applyImportedMapping}>{t("pages.customExports.applyMapping")}</Button></div>{draft.importedHeaders.map((header) => <div key={header} className="grid gap-2 rounded-2xl border border-border/60 p-3 sm:grid-cols-[1fr_1fr]"><span className="truncate self-center rounded-lg bg-surface-secondary px-2 py-2 text-xs">{header}</span><FormSelect label={t("pages.customExports.mapHeader")} selectedKey={draft.importMapping[header] ?? ""} onSelectionChange={(key) => setDraft({ ...draft, importMapping: { ...draft.importMapping, [header]: key } })} options={fields.map((field) => ({ id: field.key, label: field.label }))} /></div>)}</div>}
                  </div>
                </div>
              </div>}
              {tab === "design" && <div className="mt-5"><CanvasEditor canvas={draft.canvas} fields={fields} onChange={(canvas) => setDraft({ ...draft, canvas })} /></div>}
              {tab === "preview" && <div className="mt-5"><Preview draft={draft} /></div>}
              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-border pt-4"><Button variant="ghost" onPress={() => void remove()} isDisabled={!editingId}><Trash size={17} />{t("pages.customExports.delete")}</Button><Button variant="secondary" onPress={() => void save()}><Save2 size={17} />{t("pages.customExports.save")}</Button>{editingId && <><Button variant="secondary" onPress={() => void exportsApi.downloadExport(editingId, "xlsx")}><DocumentDownload size={17} />{t("pages.customExports.exportExcel")}</Button><Button onPress={() => void exportsApi.downloadExport(editingId, "pdf")}><Eye size={17} />{t("pages.customExports.exportPdf")}</Button></>}</div>
            </main>
          ) : <div className="glass flex min-h-[360px] items-center justify-center rounded-2xl p-8 text-center"><div><Edit2 size={32} className="mx-auto text-muted" /><p className="mt-3 text-sm text-muted">{t("pages.customExports.newTemplate")}</p><Button className="mt-4" onPress={startNew}>{t("pages.customExports.newTemplate")}</Button></div></div>}
        </div>
      )}
    </div>
  );
}
