"use client";

import type { ReactNode } from "react";

import { toPersianDigits } from "@/common/utils";
import type { ImportRowGroup } from "./import-row-group.util";

type BankImportRowGroupProps = {
  group: ImportRowGroup;
  children: ReactNode;
};

export function BankImportRowGroup({ group, children }: BankImportRowGroupProps) {
  if (!group.isPairedDocument) {
    return <>{children}</>;
  }

  return (
    <section className="rounded-2xl border border-accent/25 bg-accent/5 p-3 space-y-2">
      <header className="flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="text-xs font-semibold text-accent">
          سند مشترک · {toPersianDigits(group.documentNumber ?? "")}
        </p>
        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
          {toPersianDigits(group.rows.length)} ردیف مرتبط
        </span>
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
