"use client";

import { useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { ArrowDown2, Filter, RowVertical, Sort, Trash } from "iconsax-reactjs";

import type {
  ExportCenterMeta,
  ExportFilters,
  ExportGroupKey,
  ExportSourceDef,
  ExportSourceRequest,
} from "@/common/interfaces/export-center.interface";
import type { ICategory } from "@/common/interfaces/category.interface";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import { countSourceFilters, defaultSourceRequest } from "@/common/utils/export-center";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { AppSearch, AppSelect } from "@/components/common/form/AppControls";
import { FormPriceInput } from "@/components/common/form/FormFields";
import { SwitchRow } from "@/components/common/form/FormKit";
import { useTranslation } from "@/i18n";

import { ChipToggleGroup, ColumnPicker, MultiSelectList, type PickOption } from "./ExportControls";

type Tab = "filters" | "columns" | "layout";

function amountToString(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function stringToAmount(value: string) {
  if (!value || value === "-") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function ExportSourcePanel({
  def,
  value,
  meta,
  onChange,
  onRemove,
  defaultOpen = false,
}: {
  def: ExportSourceDef;
  value: ExportSourceRequest;
  meta: ExportCenterMeta;
  onChange: (value: ExportSourceRequest) => void;
  onRemove: () => void;
  defaultOpen?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  const [tab, setTab] = useState<Tab>("filters");
  const filters = useMemo(() => value.filters ?? {}, [value.filters]);
  const has = (key: ExportSourceDef["filters"][number]) => def.filters.includes(key);
  const setFilters = (patch: Partial<ExportFilters>) => onChange({ ...value, filters: { ...filters, ...patch } });
  const filterCount = countSourceFilters(filters);
  const columns = value.columns?.length ? value.columns : def.columns.filter((c) => c.default).map((c) => c.key);
  const panelId = `export-source-${def.key}`;

  const categoryOptions = useMemo<PickOption[]>(
    () => getCategorySelectOptions(meta.options.categories as unknown as ICategory[]),
    [meta.options.categories],
  );
  const cardOptions = useMemo<PickOption[]>(
    () =>
      meta.options.cards.map((card) => ({
        id: card._id,
        label: card.title,
        hint: card.lastFour ? toPersianDigits(card.lastFour) : card.bankName,
      })),
    [meta.options.cards],
  );
  const projectOptions = useMemo<PickOption[]>(() => {
    const list = meta.options.projects.map((project) => ({ id: project._id, label: project.title }));
    return def.key === "transactions" ? [{ id: "none", label: t("exports.filters.noProject") }, ...list] : list;
  }, [def.key, meta.options.projects, t]);
  const contextOptions = useMemo<PickOption[]>(
    () =>
      meta.options.contexts.map((context) => ({
        id: context._id,
        label: context.title,
        hint: `${context.type === "venture" ? t("exports.filters.venture") : t("exports.filters.project")} · ${
          context.role === "owner" ? t("exports.filters.owner") : t("exports.filters.partner")
        }`,
      })),
    [meta.options.contexts, t],
  );
  const boxOptions = useMemo<PickOption[]>(
    () => meta.options.boxes.map((box) => ({ id: box._id, label: box.title })),
    [meta.options.boxes],
  );
  const noteCategoryOptions = useMemo<PickOption[]>(
    () => [
      { id: "none", label: t("exports.filters.uncategorized") },
      ...meta.options.noteCategories.map((category) => ({ id: category._id, label: category.title })),
    ],
    [meta.options.noteCategories, t],
  );

  const currency = meta.preferences.currency;
  const sortOptions = def.columns.map((column) => ({ value: column.key, label: column.label }));
  const groupOptions = def.groups.map((group) => ({ value: group, label: meta.groups[group] }));

  const tabs: Array<{ id: Tab; label: string; icon: typeof Filter; badge?: number }> = [
    { id: "filters", label: t("exports.panel.filters"), icon: Filter, badge: filterCount },
    { id: "columns", label: t("exports.panel.columns"), icon: RowVertical, badge: columns.length },
    { id: "layout", label: t("exports.panel.layout"), icon: Sort },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-surface-secondary/30">
      <div className="flex items-center gap-2 p-3 sm:p-4">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{def.label}</span>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {[
                t("exports.panel.columnsCount", { count: columns.length }),
                filterCount ? t("exports.panel.filtersCount", { count: filterCount }) : t("exports.panel.noFilters"),
                value.groupBy && value.groupBy !== "none" ? meta.groups[value.groupBy] : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </span>
          <ArrowDown2 size={18} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={t("exports.panel.remove", { name: def.label })}
          onPress={onRemove}
          className="text-muted hover:text-danger"
        >
          <Trash size={17} />
        </Button>
      </div>

      {open ? (
        <div id={panelId} className="border-t border-border/50 bg-surface p-3 sm:p-4">
          <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-surface-secondary p-1" role="tablist">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-xs font-semibold transition-colors ${
                    active ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                  onClick={() => setTab(item.id)}
                >
                  <Icon size={15} className="hidden sm:block" />
                  {item.label}
                  {item.badge ? (
                    <span className="rounded-full bg-accent/15 px-1.5 text-[10px] text-accent">{toPersianDigits(item.badge)}</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {tab === "filters" ? (
            <div className="space-y-5">
              {def.filters.length === 0 ? <p className="text-sm text-muted">{t("exports.filters.none")}</p> : null}
              {has("type") && def.types?.length ? (
                <ChipToggleGroup
                  single
                  label={t("exports.filters.type")}
                  options={def.types.map((type) => ({ id: type.value, label: type.label }))}
                  value={filters.type ? [filters.type] : []}
                  onChange={(next) => setFilters({ type: next[0] })}
                />
              ) : null}
              {has("statuses") && def.statuses?.length ? (
                <ChipToggleGroup
                  label={t("exports.filters.status")}
                  options={def.statuses.map((status) => ({ id: status.value, label: status.label }))}
                  value={filters.statuses ?? []}
                  onChange={(next) => setFilters({ statuses: next })}
                />
              ) : null}
              {has("priorities") ? (
                <ChipToggleGroup
                  label={t("exports.filters.priority")}
                  options={[
                    { id: "high", label: t("exports.filters.priorityHigh") },
                    { id: "medium", label: t("exports.filters.priorityMedium") },
                    { id: "low", label: t("exports.filters.priorityLow") },
                  ]}
                  value={filters.priorities ?? []}
                  onChange={(next) => setFilters({ priorities: next })}
                />
              ) : null}
              {has("categories") ? (
                <div className="space-y-2">
                  <MultiSelectList
                    label={t("exports.filters.categories")}
                    options={categoryOptions}
                    value={filters.categories ?? []}
                    onChange={(next) => setFilters({ categories: next })}
                    emptyText={t("exports.filters.noCategories")}
                  />
                  {filters.categories?.length ? (
                    <SwitchRow
                      label={t("exports.filters.includeSub")}
                      description={t("exports.filters.includeSubHint")}
                      selected={filters.includeSubcategories !== false}
                      onChange={(selected) => setFilters({ includeSubcategories: selected })}
                    />
                  ) : null}
                </div>
              ) : null}
              {has("cards") && cardOptions.length ? (
                <MultiSelectList
                  label={t("exports.filters.cards")}
                  options={cardOptions}
                  value={filters.cards ?? []}
                  onChange={(next) => setFilters({ cards: next })}
                  emptyText={t("exports.filters.noCards")}
                />
              ) : null}
              {has("projects") && projectOptions.length ? (
                <MultiSelectList
                  label={t("exports.filters.projects")}
                  options={projectOptions}
                  value={filters.projects ?? []}
                  onChange={(next) => setFilters({ projects: next })}
                  emptyText={t("exports.filters.noProjects")}
                />
              ) : null}
              {has("contexts") ? (
                <MultiSelectList
                  label={t("exports.filters.contexts")}
                  options={contextOptions}
                  value={filters.contexts ?? []}
                  onChange={(next) => setFilters({ contexts: next })}
                  emptyText={t("exports.filters.noContexts")}
                />
              ) : null}
              {has("boxes") && boxOptions.length ? (
                <MultiSelectList
                  label={t("exports.filters.boxes")}
                  options={boxOptions}
                  value={filters.boxes ?? []}
                  onChange={(next) => setFilters({ boxes: next })}
                  emptyText={t("exports.filters.noBoxes")}
                />
              ) : null}
              {has("noteCategories") ? (
                <MultiSelectList
                  label={t("exports.filters.noteCategories")}
                  options={noteCategoryOptions}
                  value={filters.noteCategories ?? []}
                  onChange={(next) => setFilters({ noteCategories: next })}
                  emptyText={t("exports.filters.noCategories")}
                />
              ) : null}
              {has("amount") ? (
                <div className="space-y-1.5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormPriceInput
                      label={t("exports.filters.minAmount")}
                      value={amountToString(filters.min)}
                      currency={currency}
                      onChange={(raw) => setFilters({ min: stringToAmount(raw) })}
                      placeholder={t("exports.filters.noLimit")}
                    />
                    <FormPriceInput
                      label={t("exports.filters.maxAmount")}
                      value={amountToString(filters.max)}
                      currency={currency}
                      onChange={(raw) => setFilters({ max: stringToAmount(raw) })}
                      placeholder={t("exports.filters.noLimit")}
                    />
                  </div>
                  <p className="text-xs text-muted">{t("exports.filters.amountHint")}</p>
                </div>
              ) : null}
              {has("currency") ? (
                <ChipToggleGroup
                  label={t("exports.filters.currency")}
                  options={[
                    { id: "toman", label: t("exports.currency.toman") },
                    { id: "usd", label: t("exports.currency.usd") },
                    { id: "dinar", label: t("exports.currency.dinar") },
                  ]}
                  value={filters.currencies ?? []}
                  onChange={(next) => setFilters({ currencies: next })}
                />
              ) : null}
              {has("flags") && def.flags?.length ? (
                <ChipToggleGroup
                  label={t("exports.filters.flags")}
                  options={def.flags.map((flag) => ({ id: flag.value, label: flag.label }))}
                  value={filters.flags ?? []}
                  onChange={(next) => setFilters({ flags: next })}
                />
              ) : null}
              {has("q") ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("exports.filters.search")}</p>
                  <AppSearch
                    value={filters.q ?? ""}
                    onChange={(q) => setFilters({ q })}
                    ariaLabel={t("exports.filters.search")}
                    placeholder={t("exports.filters.searchPlaceholder")}
                  />
                </div>
              ) : null}
              {has("excludeBoxTransfers") ? (
                <SwitchRow
                  label={t("exports.filters.excludeBoxes")}
                  description={t("exports.filters.excludeBoxesHint")}
                  selected={filters.excludeBoxTransfers === true}
                  onChange={(selected) => setFilters({ excludeBoxTransfers: selected })}
                />
              ) : null}
              {has("includeGeneral") ? (
                <SwitchRow
                  label={t("exports.filters.includeGeneral")}
                  description={t("exports.filters.includeGeneralHint")}
                  selected={filters.includeGeneral !== false}
                  onChange={(selected) => setFilters({ includeGeneral: selected })}
                />
              ) : null}
              {filterCount ? (
                <Button size="sm" variant="ghost" onPress={() => onChange({ ...value, filters: defaultSourceRequest(def).filters })}>
                  {t("exports.filters.clear")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "columns" ? (
            <ColumnPicker columns={def.columns} value={columns} onChange={(next) => onChange({ ...value, columns: next })} />
          ) : null}

          {tab === "layout" ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{t("exports.layout.sortBy")}</p>
                  <AppSelect
                    ariaLabel={t("exports.layout.sortBy")}
                    value={value.sort?.field ?? def.defaultSort.field}
                    options={sortOptions}
                    onChange={(field) => onChange({ ...value, sort: { field, dir: value.sort?.dir ?? def.defaultSort.dir } })}
                  />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{t("exports.layout.direction")}</p>
                  <AppSelect
                    ariaLabel={t("exports.layout.direction")}
                    value={value.sort?.dir ?? def.defaultSort.dir}
                    options={[
                      { value: "desc", label: t("exports.layout.desc") },
                      { value: "asc", label: t("exports.layout.asc") },
                    ]}
                    onChange={(dir) =>
                      onChange({
                        ...value,
                        sort: { field: value.sort?.field ?? def.defaultSort.field, dir: dir === "asc" ? "asc" : "desc" },
                      })
                    }
                  />
                </div>
              </div>
              {def.groups.length > 1 ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">{t("exports.layout.groupBy")}</p>
                  <AppSelect
                    ariaLabel={t("exports.layout.groupBy")}
                    value={value.groupBy ?? "none"}
                    options={groupOptions}
                    onChange={(groupBy) => onChange({ ...value, groupBy: groupBy as ExportGroupKey })}
                  />
                  <p className="text-xs leading-5 text-muted">{t("exports.layout.groupHint")}</p>
                </div>
              ) : (
                <p className="text-xs text-muted">{t("exports.layout.noGroups")}</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
