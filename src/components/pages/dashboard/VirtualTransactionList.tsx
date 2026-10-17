"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Spinner } from "@heroui/react";

import type { UserCurrency } from "@/common/constants/user-preferences";
import { resolveBudgetDateCalendar } from "@/common/constants/user-preferences";
import type { IBudget } from "@/common/interfaces/budget.interface";
import { formatBudgetDate } from "@/common/utils/calendar-date";
import { formatPriceWithCurrency } from "@/common/utils/format-currency";
import { toPersianDigits } from "@/common/utils/persian-digits";
import { TransactionCard } from "./TransactionCard";

export type DayGroup = { key: string; budgets: IBudget[]; income: number; cost: number };

type Row =
  | { kind: "day"; key: string; group: DayGroup }
  | { kind: "tx"; key: string; budget: IBudget; number: number };

/**
 * Transaction list that only renders the rows near the screen (the page itself
 * scrolls), and asks for the next page when the reader gets close to the end.
 * Row heights are measured, so expanded cards and day headers stay in place.
 */
export function VirtualTransactionList({
  groups,
  showDayHeaders,
  currency,
  selectMode,
  selectedIds,
  onToggleSelect,
  hasMore,
  loadingMore,
  onLoadMore,
  total,
}: {
  groups: DayGroup[];
  showDayHeaders: boolean;
  currency: UserCurrency;
  selectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  total: number;
}) {
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let number = 0;
    for (const group of groups) {
      if (showDayHeaders && group.key !== "sorted") out.push({ kind: "day", key: `day-${group.key}`, group });
      for (const budget of group.budgets) out.push({ kind: "tx", key: budget._id, budget, number: ++number });
    }
    return out;
  }, [groups, showDayHeaders]);

  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Distance from the top of the document to the list (it moves when the
  // cards above it change size), so the virtualizer maps scroll to rows.
  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const update = () => setScrollMargin(element.getBoundingClientRect().top + window.scrollY);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    // Close to the measured heights (phone: card 76px, day header 48px) so
    // fast flings don't shift the list while rows get measured.
    estimateSize: (index) =>
      rows[index]?.kind === "day"
        ? 48
        : typeof window !== "undefined" && window.innerWidth >= 1024
          ? 86
          : 76,
    overscan: 10,
    scrollMargin,
    getItemKey: (index) => rows[index]?.key ?? index,
  });
  const items = virtualizer.getVirtualItems();
  const lastIndex = items.length ? items[items.length - 1].index : -1;

  // Load the next page once the last rendered row is within a few of the end.
  useEffect(() => {
    if (hasMore && !loadingMore && lastIndex >= rows.length - 8) onLoadMore();
  }, [hasMore, loadingMore, lastIndex, rows.length, onLoadMore]);

  return (
    <div>
      <div ref={listRef} className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {items.map((item) => {
          const row = rows[item.index];
          if (!row) return null;
          return (
            <div
              key={item.key}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)` }}
            >
              {row.kind === "day" ? (
                <DayHeader group={row.group} currency={currency} first={item.index === 0} />
              ) : (
                <div className="pb-2.5 lg:pb-3">
                  <TransactionCard
                    budget={row.budget}
                    rowNumber={row.number}
                    selectMode={selectMode}
                    selected={selectedIds.has(row.budget._id)}
                    onToggleSelect={() => onToggleSelect(row.budget._id)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex min-h-12 items-center justify-center py-3 text-xs text-muted" aria-live="polite">
        {loadingMore ? (
          <span className="inline-flex items-center gap-2">
            <Spinner size="sm" /> در حال بارگذاری تراکنش‌های بیشتر…
          </span>
        ) : hasMore ? (
          <button type="button" className="rounded-full px-3 py-1.5 hover:bg-surface-secondary" onClick={onLoadMore}>
            نمایش تراکنش‌های بیشتر
          </button>
        ) : rows.length ? (
          <span>همهٔ {toPersianDigits(total)} تراکنش نمایش داده شد</span>
        ) : null}
      </div>
    </div>
  );
}

function DayHeader({ group, currency, first }: { group: DayGroup; currency: UserCurrency; first: boolean }) {
  const head = group.budgets[0];
  const net = group.income - group.cost;
  return (
    <div className={`pb-2.5 lg:pb-3 ${first ? "" : "pt-2.5"}`}>
      <div className="pb-day-header">
        <span className="text-foreground/80">
          {formatBudgetDate(head.year, head.month, head.day, resolveBudgetDateCalendar(head.dateCalendar))}
        </span>
        {net !== 0 ? (
          <span className={net > 0 ? "text-income" : "text-expense"}>
            {net > 0 ? "+" : "−"}
            {formatPriceWithCurrency(Math.abs(net), currency)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
