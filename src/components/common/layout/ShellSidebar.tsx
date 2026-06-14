"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Add } from "iconsax-reactjs";

import { ShellAccountMenu } from "@/components/common/layout/ShellAccountMenu";
import {
  CREATE_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
} from "@/components/common/layout/shell-nav";
import { PATHS } from "@/common/constants";

export function ShellSidebar() {
  const pathname = usePathname();

  return (
    <aside className="pb-sidebar" aria-label="ناوبری دسکتاپ">
      <div className="flex h-full flex-col p-5 xl:p-6">
        <Link href={PATHS.HOME} className="mb-8 flex items-center gap-3 px-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
            PB
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Paradise Budget</p>
            <p className="text-xs text-muted">مدیریت مالی شخصی</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const active =
              item.href === PATHS.HOME
                ? pathname === PATHS.HOME
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="pb-sidebar-link"
                data-active={active ? "true" : "false"}
              >
                <item.icon
                  size={20}
                  variant={active ? "Bold" : "Linear"}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href={CREATE_NAV_ITEM.href} className="pb-sidebar-cta mt-4">
          <Add size={20} variant="Bold" />
          {CREATE_NAV_ITEM.label}
        </Link>

        <div className="mt-auto border-t border-border/50 pt-5">
          <ShellAccountMenu variant="sidebar" />
        </div>
      </div>
    </aside>
  );
}
