"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Add } from "iconsax-reactjs";

import { ShellAccountMenu } from "@/components/common/layout/ShellAccountMenu";
import { ShellNavGroup } from "@/components/common/layout/ShellNavGroup";
import {
  CREATE_NAV_ITEM,
  BANK_IMPORT_NAV_ITEM,
  PLANNING_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
} from "@/components/common/layout/shell-nav";
import { PATHS } from "@/common/constants";
import { AppLogo } from "@/components/common/brand/AppLogo";

export function ShellSidebar() {
  const pathname = usePathname();

  return (
    <aside className="pb-sidebar" aria-label="ناوبری دسکتاپ">
      <div className="flex h-full flex-col overflow-y-auto p-5 xl:p-6">
        <Link href={PATHS.HOME} className="mb-6 block px-2">
          <AppLogo />
        </Link>

        <div>
          <p className="mb-2 px-3 text-xs font-semibold tracking-wide text-muted">
            اصلی
          </p>
          <nav className="flex flex-col gap-0.5">
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
                  <item.icon size={20} variant={active ? "Bold" : "Linear"} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <Link href={CREATE_NAV_ITEM.href} className="pb-sidebar-cta mt-4">
          <Add size={20} variant="Bold" />
          {CREATE_NAV_ITEM.label}
        </Link>

        <Link href={BANK_IMPORT_NAV_ITEM.href} className="pb-sidebar-secondary-cta mt-2">
          <BANK_IMPORT_NAV_ITEM.icon size={18} variant="Bold" />
          {BANK_IMPORT_NAV_ITEM.label}
        </Link>

        <ShellNavGroup
          title="برنامه‌ریزی و ابزار"
          items={PLANNING_NAV_ITEMS}
          variant="sidebar"
        />

        <div className="mt-auto mt-6 border-t border-border/50 pt-5">
          <ShellAccountMenu variant="sidebar" showPlanning={false} />
        </div>
      </div>
    </aside>
  );
}
