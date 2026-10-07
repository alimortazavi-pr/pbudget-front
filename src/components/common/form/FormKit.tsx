"use client";

import { Switch } from "@heroui/react";
import type { ReactNode } from "react";

/**
 * Layout primitives for forms: a titled section, a responsive grid, a field
 * whose control always fills its column, and a switch row with an explanation.
 * Use these instead of ad-hoc `label` + `span` stacks so every form lines up.
 */

export function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border/60 bg-surface-secondary/40 p-4 sm:p-5 ${className}`}>
      {title ? (
        <header className="mb-4">
          <h3 className="text-sm font-bold">{title}</h3>
          {description ? <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p> : null}
        </header>
      ) : null}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function FormGrid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: ReactNode }) {
  const columns = cols === 3 ? "sm:grid-cols-3" : cols === 2 ? "sm:grid-cols-2" : "";
  return <div className={`grid items-start gap-4 ${columns}`}>{children}</div>;
}

export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="ms-1 text-danger">*</span> : null}
      </span>
      {children}
      {error ? (
        <span className="text-xs leading-5 text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs leading-5 text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function SwitchRow({
  label,
  description,
  selected,
  onChange,
  isDisabled,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onChange: (selected: boolean) => void;
  isDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description ? <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p> : null}
      </div>
      <Switch aria-label={label} size="sm" isSelected={selected} isDisabled={isDisabled} onChange={onChange}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch>
    </div>
  );
}
