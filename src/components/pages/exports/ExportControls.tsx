"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Button } from "@heroui/react";
import { ArrowDown2, ArrowUp2, CloseCircle, Eye, EyeSlash, RefreshLeftSquare } from "iconsax-reactjs";

import type { ExportColumnDef } from "@/common/interfaces/export-center.interface";
import { normalizeQuickText } from "@/common/utils/quick-entry";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { AppCheckbox, AppSearch } from "@/components/common/form/AppControls";
import { useTranslation } from "@/i18n";

export type PickOption = { id: string; label: string; hint?: string };

/** Toggle chips (statuses, currencies, flags…). Every chip is a real button with aria-pressed. */
export function ChipToggleGroup({
  label,
  options,
  value,
  onChange,
  single = false,
}: {
  label: string;
  options: PickOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** Behaves like a radio group with an "all" state when nothing is pressed. */
  single?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-2" role="group" aria-labelledby={id}>
      <p id={id} className="text-sm font-medium">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                if (single) onChange(active ? [] : [option.id]);
                else onChange(active ? value.filter((item) => item !== option.id) : [...value, option.id]);
              }}
              className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                active
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface-secondary text-foreground/80 hover:border-accent/50"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Searchable checklist with the picked items shown as removable chips. */
export function MultiSelectList({
  label,
  options,
  value,
  onChange,
  emptyText,
  footer,
}: {
  label: string;
  options: PickOption[];
  value: string[];
  onChange: (value: string[]) => void;
  emptyText: string;
  footer?: ReactNode;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const byId = useMemo(() => new Map(options.map((option) => [option.id, option])), [options]);
  const filtered = useMemo(() => {
    const q = normalizeQuickText(query).trim();
    if (!q) return options;
    return options.filter((option) => normalizeQuickText(option.label).includes(q));
  }, [options, query]);

  const toggle = (id: string, selected: boolean) =>
    onChange(selected ? [...value, id] : value.filter((item) => item !== id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? t("exports.controls.closeList") : value.length ? t("exports.controls.edit") : t("exports.controls.choose")}
        </button>
      </div>
      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <span
              key={id}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-accent/10 py-1 ps-3 pe-1 text-xs font-medium text-accent"
            >
              <span className="truncate">{byId.get(id)?.label.replace(/^(— )+/, "") ?? id}</span>
              <button
                type="button"
                className="rounded-full p-0.5 hover:bg-accent/20"
                aria-label={t("exports.controls.remove", { name: byId.get(id)?.label ?? id })}
                onClick={() => toggle(id, false)}
              >
                <CloseCircle size={15} />
              </button>
            </span>
          ))}
          {value.length > 1 ? (
            <button type="button" className="px-2 text-xs text-muted hover:text-danger" onClick={() => onChange([])}>
              {t("exports.controls.clearAll")}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted">{t("exports.controls.allIncluded")}</p>
      )}
      {open ? (
        <div id={listId} className="space-y-2 rounded-2xl border border-border/60 bg-surface p-2">
          {options.length > 6 ? (
            <AppSearch value={query} onChange={setQuery} ariaLabel={label} placeholder={t("exports.controls.search")} />
          ) : null}
          <div className="max-h-56 space-y-0.5 overflow-y-auto overscroll-contain pe-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-muted">{options.length ? t("common.noItemsFound") : emptyText}</p>
            ) : (
              filtered.map((option) => (
                <AppCheckbox
                  key={option.id}
                  isSelected={value.includes(option.id)}
                  onChange={(selected) => toggle(option.id, selected)}
                  className="w-full rounded-xl px-2 py-1.5 hover:bg-surface-secondary"
                >
                  <span className="text-sm">{option.label}</span>
                  {option.hint ? <span className="ms-2 text-xs text-muted">{option.hint}</span> : null}
                </AppCheckbox>
              ))
            )}
          </div>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** Pick, hide and reorder the columns of one source. */
export function ColumnPicker({
  columns,
  value,
  onChange,
}: {
  columns: ExportColumnDef[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const { t } = useTranslation();
  const byKey = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns]);
  const selected = value.filter((key) => byKey.has(key));
  const hidden = columns.filter((column) => !selected.includes(column.key));

  function move(index: number, delta: number) {
    const next = [...selected];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">
          {t("exports.columns.summary", { selected: selected.length, total: columns.length })}
        </p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onPress={() => onChange(columns.map((column) => column.key))}>
            {t("exports.columns.all")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => onChange(columns.filter((column) => column.default).map((column) => column.key))}
          >
            <RefreshLeftSquare size={15} />
            {t("exports.columns.reset")}
          </Button>
        </div>
      </div>
      <ol className="space-y-1.5" aria-label={t("exports.columns.selected")}>
        {selected.map((key, index) => {
          const column = byKey.get(key)!;
          return (
            <li
              key={key}
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface px-2 py-1.5"
            >
              <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted">{toPersianDigits(index + 1)}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{column.label}</span>
              <span className="hidden shrink-0 rounded-full bg-surface-secondary px-2 py-0.5 text-[10px] text-muted sm:inline">
                {t(`exports.kinds.${column.kind}`)}
              </span>
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-muted hover:bg-surface-secondary disabled:opacity-30"
                  disabled={index === 0}
                  aria-label={t("exports.columns.moveUp", { name: column.label })}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp2 size={16} />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-muted hover:bg-surface-secondary disabled:opacity-30"
                  disabled={index === selected.length - 1}
                  aria-label={t("exports.columns.moveDown", { name: column.label })}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown2 size={16} />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                  disabled={selected.length === 1}
                  aria-label={t("exports.columns.hide", { name: column.label })}
                  onClick={() => onChange(selected.filter((item) => item !== key))}
                >
                  <EyeSlash size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {hidden.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted">{t("exports.columns.available")}</p>
          <div className="flex flex-wrap gap-1.5">
            {hidden.map((column) => (
              <button
                key={column.key}
                type="button"
                className="inline-flex min-h-8 items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-foreground/80 hover:border-accent hover:text-accent"
                onClick={() => onChange([...selected, column.key])}
              >
                <Eye size={14} />
                {column.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
