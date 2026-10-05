"use client";

import Link from "next/link";
import { Button, Input, Modal } from "@heroui/react";
import { ArrowLeft2, ArrowRight2, SearchNormal1 } from "iconsax-reactjs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { AppModal, AppModalDialog, AppModalHeader } from "@/components/common/ui/AppModal";
import type { Pagination } from "@/common/interfaces/admin";
import { formatNumberFa, presenceOf } from "./admin-format";
import { AnimatedNumber } from "@/components/common/motion/AnimatedNumber";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-secondary text-muted",
  accent: "bg-accent/12 text-accent",
  success: "bg-success/15 text-success-foreground",
  warning: "bg-warning/18 text-warning-foreground",
  danger: "bg-danger/12 text-danger",
  info: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
};

export function AdminPageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className = "",
  bodyClassName = "",
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-2xl border border-border/60 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}>
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-[15px] font-bold">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={bodyClassName || "p-4 sm:p-5"}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "accent",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <div className="pb-lift flex h-full items-start justify-between gap-3 rounded-2xl border border-border/60 bg-surface p-4 hover:border-accent/30">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p
          className={`mt-1.5 font-extrabold tracking-tight tabular-nums ${
            typeof value === "string" && value.length > 11 ? "text-lg sm:text-xl" : "text-2xl"
          }`}
        >
          {typeof value === "number" ? <AnimatedNumber value={value} format={formatNumberFa} /> : value}
        </p>
        {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      </div>
      {icon ? (
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
          {icon}
        </span>
      ) : null}
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  );
}

const PRESENCE: Record<ReturnType<typeof presenceOf>, { label: string; dot: string }> = {
  online: { label: "آنلاین", dot: "bg-emerald-500" },
  today: { label: "امروز فعال", dot: "bg-emerald-400/70" },
  week: { label: "این هفته", dot: "bg-amber-400" },
  idle: { label: "غیرفعال", dot: "bg-zinc-400" },
  never: { label: "هرگز وارد نشده", dot: "bg-zinc-300 dark:bg-zinc-600" },
};

export function PresenceDot({ lastSeenAt, withLabel = false }: { lastSeenAt?: string | null; withLabel?: boolean }) {
  const presence = PRESENCE[presenceOf(lastSeenAt)];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted" title={presence.label}>
      <span className={`size-2 rounded-full ${presence.dot}`} />
      {withLabel ? presence.label : null}
    </span>
  );
}

export function UserAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
  const palette = ["from-rose-400 to-pink-500", "from-violet-400 to-indigo-500", "from-teal-400 to-emerald-500", "from-amber-400 to-orange-500", "from-sky-400 to-blue-500"];
  const index = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette[index]} font-bold text-white`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials || "؟"}
    </span>
  );
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  size = "md",
}: {
  items: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1" role="tablist">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl font-medium transition ${
              size === "sm" ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-sm"
            } ${active ? "bg-foreground text-background shadow-sm" : "bg-surface-secondary text-muted hover:text-foreground"}`}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-background/20" : "bg-surface"}`}>
                {formatNumberFa(item.count)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function PaginationBar({ pagination, onPage }: { pagination?: Pagination | null; onPage: (page: number) => void }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total } = pagination;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-muted">
      <span>
        صفحه {formatNumberFa(page)} از {formatNumberFa(totalPages)} · {formatNumberFa(total)} مورد
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" isDisabled={page <= 1} onPress={() => onPage(page - 1)}>
          <ArrowRight2 size={16} />
          قبلی
        </Button>
        <Button size="sm" variant="secondary" isDisabled={page >= totalPages} onPress={() => onPage(page + 1)}>
          بعدی
          <ArrowLeft2 size={16} />
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-muted">{icon}</div> : null}
      <p className="font-semibold">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm leading-6 text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SkeletonRows({ rows = 5, height = "h-14" }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={`${height} animate-pulse rounded-xl bg-surface-secondary`} />
      ))}
    </div>
  );
}

/** Search box that reports its value after the user pauses typing. */
export function SearchField({
  value,
  onChange,
  placeholder = "جستجو…",
  delay = 350,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const timer = useRef<number | null>(null);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);
  return (
    <div className={`relative ${className}`}>
      <SearchNormal1 size={17} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-muted" />
      <Input
        aria-label={placeholder}
        variant="secondary"
        value={draft}
        placeholder={placeholder}
        className="w-full ps-9"
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (timer.current) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => onChange(next.trim()), delay);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (timer.current) window.clearTimeout(timer.current);
            onChange(draft.trim());
          }
        }}
      />
    </div>
  );
}

/**
 * Confirmation dialog. With `confirmText`, the admin must type it (e.g. the
 * user's mobile) before a destructive action is enabled.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "تأیید",
  tone = "danger",
  confirmText,
  children,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  confirmText?: string;
  children?: ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  if (!mounted) return null;
  const blocked = Boolean(confirmText) && typed.trim() !== confirmText;
  return createPortal(
    <AppModal open={open} onOpenChange={onOpenChange} isDismissable={!isPending}>
      <AppModalDialog className="sm:max-w-lg">
        <AppModalHeader>
          <Modal.Heading>{title}</Modal.Heading>
        </AppModalHeader>
        <Modal.Body className="space-y-4">
          {description ? <div className="text-sm leading-7 text-muted">{description}</div> : null}
          {children}
          {confirmText ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                برای تأیید، <span className="font-mono font-bold text-foreground" dir="ltr">{confirmText}</span> را تایپ کنید.
              </p>
              <Input aria-label="تأیید" variant="secondary" dir="ltr" value={typed} onChange={(event) => setTyped(event.target.value)} />
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="ghost" isDisabled={isPending} onPress={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} isPending={isPending} isDisabled={blocked} onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </AppModalDialog>
    </AppModal>,
    document.body,
  );
}

/** Generic form dialog with a submit button. */
export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "ذخیره",
  isPending,
  onSubmit,
  children,
  wide = false,
  submitDisabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  submitLabel?: string;
  isPending?: boolean;
  onSubmit: () => void;
  children: ReactNode;
  wide?: boolean;
  submitDisabled?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <AppModal open={open} onOpenChange={onOpenChange} isDismissable={!isPending}>
      <AppModalDialog className={wide ? "sm:max-w-3xl" : "sm:max-w-lg"}>
        <AppModalHeader>
          <Modal.Heading>{title}</Modal.Heading>
          {description ? <p className="mt-1 text-xs leading-5 text-muted">{description}</p> : null}
        </AppModalHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!submitDisabled) onSubmit();
          }}
        >
          <Modal.Body className="max-h-[65dvh] space-y-4 overflow-y-auto">{children}</Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="ghost" isDisabled={isPending} onPress={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" isPending={isPending} isDisabled={submitDisabled}>
              {submitLabel}
            </Button>
          </Modal.Footer>
        </form>
      </AppModalDialog>
    </AppModal>,
    document.body,
  );
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 text-end font-medium">{children}</span>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-muted">{hint}</span> : null}
    </label>
  );
}

export function NativeSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-10 w-full cursor-pointer rounded-[var(--field-radius)] border border-border bg-[var(--field-background)] px-3 text-sm text-[var(--field-foreground)] outline-none transition focus:border-accent ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
