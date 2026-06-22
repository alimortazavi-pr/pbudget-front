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
};

function ShellNavRow({ item, active, className, onNavigate }: ShellNavRowProps) {
  const Icon = item.icon as IconComponent;
  const content: ReactNode = (
    <>
      <Icon size={20} variant={active ? "Bold" : "Linear"} />
      <span>{item.label}</span>
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
