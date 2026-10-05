"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { CloseCircle, Filter } from "iconsax-reactjs";

import * as cardsApi from "@/common/api/payment-cards";
import * as projectsApi from "@/common/api/projects";
import { getCategorySelectOptions } from "@/common/utils/category-tree";
import {
  EMPTY_FILTERS,
  FILTER_FLAGS,
  FILTER_KEYS,
  countActiveFilters,
  flagList,
  type FilterFlag,
  type TransactionFilters,
} from "@/common/utils/transaction-filters";
import { AppSearch } from "@/components/common/form/AppControls";
import { FormCategoryComboBox, FormPriceInput, FormSelect } from "@/components/common/form/FormFields";
import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import { FilterDatePicker } from "@/components/pages/dashboard/FilterDatePicker";
import { useTranslation } from "@/components/providers/LanguageProvider";
import { useCurrencyLabels } from "@/i18n/hooks/useCurrencyLabels";
import type { ICategory } from "@/common/interfaces/category.interface";
import type { IPaymentCard } from "@/common/interfaces/payment-card.interface";
import type { IProject } from "@/common/interfaces/project.interface";
import { useAppSelector } from "@/stores/hooks";
import { userSelector } from "@/stores/profile";

export type FilterPatch = Record<string, string>;

const FLAG_LABEL: Record<FilterFlag, string> = {
  debt: "dashboard.flagDebt",
  imported: "dashboard.flagImported",
  uncategorized: "dashboard.flagUncategorized",
  noNote: "dashboard.flagNoNote",
  hasNote: "dashboard.flagHasNote",
  project: "dashboard.flagProject",
};

const SORTS = [
  { id: "", label: "dashboard.sortNewest" },
  { id: "oldest", label: "dashboard.sortOldest" },
  { id: "highest", label: "dashboard.sortHighest" },
  { id: "lowest", label: "dashboard.sortLowest" },
] as const;

function splitDate(value: string) {
  const match = /^(\d{3,4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  return match ? { year: match[1], month: String(Number(match[2])), day: String(Number(match[3])) } : { year: "", month: "", day: "" };
}

function joinDate(parts: { year: string; month: string; day: string }) {
  return parts.year && parts.month && parts.day
    ? `${parts.year}-${parts.month.padStart(2, "0")}-${parts.day.padStart(2, "0")}`
    : "";
}

/* ------------------------------------------------------------- search + button */

export function TransactionSearchBar({
  filters,
  category,
  onChange,
  onOpenAdvanced,
}: {
  filters: TransactionFilters;
  category: string;
  onChange: (patch: FilterPatch) => void;
  onOpenAdvanced: () => void;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState(filters.q);
  const active = countActiveFilters({ ...filters, q: "" }, category);

  useEffect(() => setText(filters.q), [filters.q]);
  // Debounced so typing doesn't rewrite the URL on every keystroke.
  useEffect(() => {
    if (text === filters.q) return;
    const id = window.setTimeout(() => onChange({ q: text.trim() }), 250);
    return () => window.clearTimeout(id);
  }, [text, filters.q, onChange]);

  return (
    <div className="flex items-center gap-2">
      <AppSearch
        className="min-w-0 flex-1"
        value={text}
        onChange={setText}
        placeholder={t("dashboard.searchPlaceholder")}
        ariaLabel={t("dashboard.searchPlaceholder")}
      />
      <button
        type="button"
        onClick={onOpenAdvanced}
        className="pb-press pb-ghost-btn relative h-11"
        data-active={active > 0}
        aria-label={t("dashboard.transactionFilters")}
      >
        <Filter size={18} variant={active ? "Bold" : "Linear"} />
        <span className="hidden sm:inline">{t("common.filter")}</span>
        {active ? <span className="pb-badge">{active}</span> : null}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- active chips */

export function ActiveFilterChips({
  filters,
  category,
  categories,
  cards,
  projects,
  unit,
  resultCount,
  onChange,
  onClear,
}: {
  filters: TransactionFilters;
  category: string;
  categories: ICategory[];
  cards: IPaymentCard[];
  projects: IProject[];
  unit: string;
  resultCount: number;
  onChange: (patch: FilterPatch) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const chips: { key: string; label: string; clear: FilterPatch }[] = [];
  if (filters.type) chips.push({ key: "type", label: t(filters.type === "0" ? "dashboard.typeIncome" : "dashboard.typeExpense"), clear: { type: "" } });
  if (category) chips.push({ key: "category", label: categories.find((c) => c._id === category)?.title ?? t("dashboard.filterByCategory"), clear: { category: "" } });
  if (filters.min) chips.push({ key: "min", label: `${t("dashboard.minAmount")}: ${filters.min} ${unit}`, clear: { min: "" } });
  if (filters.max) chips.push({ key: "max", label: `${t("dashboard.maxAmount")}: ${filters.max} ${unit}`, clear: { max: "" } });
  if (filters.from) chips.push({ key: "from", label: `${t("dashboard.fromDate")}: ${filters.from.replace(/-/g, "/")}`, clear: { from: "" } });
  if (filters.to) chips.push({ key: "to", label: `${t("dashboard.toDate")}: ${filters.to.replace(/-/g, "/")}`, clear: { to: "" } });
  if (filters.card) chips.push({ key: "card", label: cards.find((c) => c._id === filters.card)?.title ?? t("dashboard.filterCard"), clear: { card: "" } });
  if (filters.project) {
    chips.push({
      key: "project",
      label: filters.project === "none" ? t("dashboard.withoutProject") : (projects.find((p) => p._id === filters.project)?.category?.title ?? t("dashboard.filterProject")),
      clear: { project: "" },
    });
  }
  for (const flag of flagList(filters.flags)) {
    chips.push({ key: `flag-${flag}`, label: t(FLAG_LABEL[flag]), clear: { flags: flagList(filters.flags).filter((f) => f !== flag).join(",") } });
  }
  if (filters.sort) chips.push({ key: "sort", label: t(SORTS.find((s) => s.id === filters.sort)?.label ?? ""), clear: { sort: "" } });
  if (!chips.length) return null;

  return (
    <div className="pb-pop flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button key={chip.key} type="button" className="pb-chip" onClick={() => onChange(chip.clear)} aria-label={`${t("common.remove")}: ${chip.label}`}>
          <span className="truncate">{chip.label}</span>
          <CloseCircle size={14} variant="Bold" />
        </button>
      ))}
      <button type="button" className="text-xs font-semibold text-accent hover:underline" onClick={onClear}>
        {t("dashboard.clearFilters")}
      </button>
      <span className="ms-auto text-xs text-muted">{t("dashboard.resultCount", { count: resultCount })}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- full modal */

export function TransactionFilterModal({
  open,
  onOpenChange,
  categories,
  category,
  filters,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ICategory[];
  category: string;
  filters: TransactionFilters;
  onApply: (patch: FilterPatch) => void;
}) {
  const { t } = useTranslation();
  const user = useAppSelector(userSelector);
  const { displayCurrencyLabel } = useCurrencyLabels();
  const unit = displayCurrencyLabel(user?.preferences?.currency ?? "toman");
  const [draft, setDraft] = useState<TransactionFilters>(filters);
  const [draftCategory, setDraftCategory] = useState(category);
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [projects, setProjects] = useState<IProject[]>([]);
  const categoryOptions = useMemo(() => getCategorySelectOptions(categories), [categories]);

  useEffect(() => {
    if (!open) return;
    setDraft(filters);
    setDraftCategory(category);
    void cardsApi.fetchPaymentCards().then(setCards).catch(() => setCards([]));
    void projectsApi.fetchProjects().then(setProjects).catch(() => setProjects([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when opening
  }, [open]);

  const set = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const flags = flagList(draft.flags);
  const toggleFlag = (flag: FilterFlag) => {
    let next = flags.includes(flag) ? flags.filter((f) => f !== flag) : [...flags, flag];
    // hasNote / noNote contradict each other.
    if (flag === "hasNote") next = next.filter((f) => f !== "noNote");
    if (flag === "noNote") next = next.filter((f) => f !== "hasNote");
    set("flags", next.join(","));
  };

  function apply() {
    const patch: FilterPatch = { category: draftCategory };
    for (const key of FILTER_KEYS) patch[key] = draft[key];
    onApply(patch);
    onOpenChange(false);
  }

  function reset() {
    setDraft(EMPTY_FILTERS);
    setDraftCategory("");
  }

  const typeOptions = [
    { id: "", label: t("dashboard.typeAll") },
    { id: "0", label: t("dashboard.typeIncome") },
    { id: "1", label: t("dashboard.typeExpense") },
  ] as const;

  return (
    <AppModal open={open} onOpenChange={onOpenChange} size="lg" mobileFull>
      <AppModalDialog className="flex max-h-[100dvh] flex-col overflow-hidden p-0 sm:max-w-2xl">
        <AppModalHeader>
          <Modal.Heading>{t("dashboard.transactionFilters")}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5">
          <section className="space-y-2">
            <h4 className="pb-filter-title">{t("dashboard.filterType")}</h4>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="pb-opt"
                  data-selected={draft.type === option.id}
                  data-tone={option.id === "0" ? "income" : option.id === "1" ? "expense" : undefined}
                  onClick={() => set("type", option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="pb-filter-title">{t("dashboard.filterByCategory")}</h4>
            <FormCategoryComboBox
              label={t("dashboard.filterByCategory")}
              hideLabel
              placeholder={t("dashboard.allCategories")}
              selectedKey={draftCategory || "all"}
              onSelectionChange={(key) => setDraftCategory(key === "all" ? "" : key)}
              allowCreate={false}
              options={[{ id: "all", label: t("dashboard.allCategories") }, ...categoryOptions]}
              emptyMessage={t("dashboard.noCategoryCreatedYet")}
            />
          </section>

          <section className="space-y-3">
            <h4 className="pb-filter-title">{t("dashboard.filterAmount")}</h4>
            <div className="grid grid-cols-2 gap-3">
              <FormPriceInput label={`${t("dashboard.minAmount")} (${unit})`} value={draft.min} onChange={(v) => set("min", v)} />
              <FormPriceInput label={`${t("dashboard.maxAmount")} (${unit})`} value={draft.max} onChange={(v) => set("max", v)} />
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="pb-filter-title">{t("dashboard.filterDateRange")}</h4>
            <p className="text-xs text-muted">{t("dashboard.dateRangeHint")}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DateField label={t("dashboard.fromDate")} value={draft.from} onChange={(v) => set("from", v)} />
              <DateField label={t("dashboard.toDate")} value={draft.to} onChange={(v) => set("to", v)} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormSelect
              label={t("dashboard.filterCard")}
              placeholder={t("dashboard.anyCard")}
              selectedKey={draft.card || "any"}
              onSelectionChange={(key) => set("card", key === "any" ? "" : key)}
              options={[
                { id: "any", label: t("dashboard.anyCard") },
                ...cards.map((card) => ({ id: card._id, label: `${card.title}${card.lastFour ? ` · ${card.lastFour}` : ""}` })),
              ]}
            />
            <FormSelect
              label={t("dashboard.filterProject")}
              placeholder={t("dashboard.anyProject")}
              selectedKey={draft.project || "any"}
              onSelectionChange={(key) => set("project", key === "any" ? "" : key)}
              options={[
                { id: "any", label: t("dashboard.anyProject") },
                { id: "none", label: t("dashboard.withoutProject") },
                ...projects.map((project) => ({ id: project._id, label: project.category?.title ?? "—" })),
              ]}
            />
          </section>

          <section className="space-y-2">
            <h4 className="pb-filter-title">{t("dashboard.filterFeatures")}</h4>
            <div className="flex flex-wrap gap-2">
              {FILTER_FLAGS.map((flag) => (
                <button key={flag} type="button" className="pb-opt pb-opt-pill" data-selected={flags.includes(flag)} onClick={() => toggleFlag(flag)}>
                  {t(FLAG_LABEL[flag])}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="pb-filter-title">{t("dashboard.filterSort")}</h4>
            <div className="flex flex-wrap gap-2">
              {SORTS.map((sort) => (
                <button key={sort.id} type="button" className="pb-opt pb-opt-pill" data-selected={draft.sort === sort.id} onClick={() => set("sort", sort.id)}>
                  {t(sort.label)}
                </button>
              ))}
            </div>
          </section>
        </Modal.Body>
        <Modal.Footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border/40 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="ghost" onPress={reset}>
            {t("dashboard.clearFilters")}
          </Button>
          <Button type="button" onPress={apply}>
            {t("dashboard.applyFilters")}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const parts = splitDate(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {value ? (
          <button type="button" className="text-xs text-accent hover:underline" onClick={() => onChange("")}>
            ×
          </button>
        ) : null}
      </div>
      <FilterDatePicker year={parts.year} month={parts.month} day={parts.day} hideHint inModal onChange={(next) => onChange(joinDate(next))} />
    </div>
  );
}
