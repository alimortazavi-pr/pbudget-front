"use client";

import { useState } from "react";
import { Input, Pagination } from "@heroui/react";

import { AppSelect } from "@/components/common/form/AppControls";

import { useTranslation } from "@/components/providers/LanguageProvider";
import { useLocalizedDate } from "@/i18n/hooks/useLocalizedDate";

export const PAGE_SIZES = [20, 30, 50, 100] as const;

/** 1 … 4 5 [6] 7 8 … 90 — always at most 7 slots, so it never wraps. */
function windowedPages(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const start = Math.max(2, Math.min(page - 1, pages - 4));
  const end = Math.min(pages - 1, Math.max(page + 1, 5));
  if (start > 2) out.push("gap");
  for (let n = start; n <= end; n++) out.push(n);
  if (end < pages - 1) out.push("gap");
  out.push(pages);
  return out;
}

export function TransactionPagination({
  page,
  pages,
  total,
  limit,
  busy,
  onPage,
  onLimit,
}: {
  page: number;
  pages: number;
  total: number;
  limit: number;
  busy?: boolean;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
}) {
  const { t } = useTranslation();
  const { formatCount } = useLocalizedDate();
  const [jump, setJump] = useState("");
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const go = (next: number) => onPage(Math.min(pages, Math.max(1, next)));

  return (
    <div className="pb-pager" aria-busy={busy}>
      <p className="pb-pager-info">
        {t("dashboard.pageRange", { from: formatCount(from), to: formatCount(to), total: formatCount(total) })}
      </p>

      <Pagination aria-label={t("dashboard.pagination")} className="w-auto" size="md">
        <Pagination.Content>
          <Pagination.Item>
            <Pagination.Previous isDisabled={page <= 1} onPress={() => go(page - 1)} aria-label={t("dashboard.previousPage")}>
              <Pagination.PreviousIcon />
            </Pagination.Previous>
          </Pagination.Item>
          <Pagination.Item className="sm:hidden">
            <span className="px-3 text-sm font-semibold">
              {t("dashboard.pageOf", { page: formatCount(page), pages: formatCount(pages) })}
            </span>
          </Pagination.Item>
          {windowedPages(page, pages).map((entry, index) =>
            entry === "gap" ? (
              <Pagination.Item key={`gap-${index}`} className="hidden sm:list-item">
                <Pagination.Ellipsis />
              </Pagination.Item>
            ) : (
              <Pagination.Item key={entry} className="hidden sm:list-item">
                <Pagination.Link isActive={entry === page} aria-label={String(entry)} onPress={() => go(entry)}>
                  {formatCount(entry)}
                </Pagination.Link>
              </Pagination.Item>
            ),
          )}
          <Pagination.Item>
            <Pagination.Next isDisabled={page >= pages} onPress={() => go(page + 1)} aria-label={t("dashboard.nextPage")}>
              <Pagination.NextIcon />
            </Pagination.Next>
          </Pagination.Item>
        </Pagination.Content>
      </Pagination>

      <div className="pb-pager-tools">
        {pages > 7 ? (
          <form
            className="w-28"
            onSubmit={(event) => {
              event.preventDefault();
              const n = parseInt(jump.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))), 10);
              if (Number.isFinite(n)) go(n);
              setJump("");
            }}
          >
            <Input
              variant="secondary"
              value={jump}
              onChange={(event) => setJump(event.target.value)}
              inputMode="numeric"
              placeholder={t("dashboard.jumpToPage")}
              aria-label={t("dashboard.jumpToPage")}
              className="text-center"
            />
          </form>
        ) : null}
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="hidden sm:inline">{t("dashboard.perPage")}</span>
          <AppSelect
            className="w-24"
            ariaLabel={t("dashboard.perPage")}
            value={String(limit)}
            onChange={(value) => onLimit(Number(value))}
            options={PAGE_SIZES.map((size) => ({ value: String(size), label: formatCount(size) }))}
          />
        </div>
      </div>
    </div>
  );
}
