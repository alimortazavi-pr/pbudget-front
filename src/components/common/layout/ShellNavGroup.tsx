"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

import type { ShellNavItem } from "./shell-nav";
import { isShellNavActive } from "./shell-nav";

type ShellNavGroupProps = {
  title: string;
  items: readonly ShellNavItem[];
  variant?: "sidebar" | "drawer";
  onNavigate?: () => void;
  itemBadges?: Record<string, number>;
};

type IconComponent = ComponentType<{
  size?: number;
  variant?: "Linear" | "Bold" | "Outline" | "Broken" | "TwoTone" | "Bulk";
}>;

function isActive(pathname: string, href: string) {
  return isShellNavActive(pathname, href);
}

export function ShellNavGroup({
  title,
  items,
  variant = "drawer",
  onNavigate,
  itemBadges,
}: ShellNavGroupProps) {
  const pathname = usePathname();

  const linkClass =
    variant === "sidebar"
      ? "pb-sidebar-link"
      : "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-surface-secondary";

  return (
    <div className={variant === "sidebar" ? "mt-6" : "mt-4"}>
      <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted">
        {title}
      </p>
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => (
          <ShellNavRow
            key={`${item.href}-${item.label}`}
            item={item}
            active={isActive(pathname, item.href)}
            className={linkClass}
            onNavigate={onNavigate}
            badge={itemBadges?.[item.href]}
          />
        ))}
      </nav>
    </div>
  );
}

type ShellNavRowProps = {
  item: ShellNavItem;
  active: boolean;
  className: string;
  onNavigate?: () => void;
  badge?: number;
};

function ShellNavRow({ item, active, className, onNavigate, badge }: ShellNavRowProps) {
  const Icon = item.icon as IconComponent;
  const badgeLabel = badge && badge > 9 ? "9+" : badge;
  const content: ReactNode = (
    <>
      <Icon size={20} variant={active ? "Bold" : "Linear"} />
      <span className="flex flex-1 items-center justify-between gap-2">
        <span>{item.label}</span>
        {badgeLabel ? (
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
            {badgeLabel}
          </span>
        ) : null}
      </span>
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      data-active={active ? "true" : "false"}
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}
