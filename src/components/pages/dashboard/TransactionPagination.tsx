"use client";

import { useState } from "react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";

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
    <nav className="pb-pager" aria-label={t("dashboard.pagination")} aria-busy={busy}>
      <p className="pb-pager-info">
        {t("dashboard.pageRange", { from: formatCount(from), to: formatCount(to), total: formatCount(total) })}
      </p>

      <div className="pb-pager-pages">
        <button type="button" className="pb-pager-btn" disabled={page <= 1} onClick={() => go(page - 1)} aria-label={t("dashboard.previousPage")}>
          <ArrowRight2 size={16} />
        </button>
        <span className="pb-pager-compact">
          {t("dashboard.pageOf", { page: formatCount(page), pages: formatCount(pages) })}
        </span>
        {windowedPages(page, pages).map((entry, index) =>
          entry === "gap" ? (
            <span key={`gap-${index}`} className="pb-pager-gap" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              className="pb-pager-btn pb-pager-num"
              data-current={entry === page}
              aria-current={entry === page ? "page" : undefined}
              onClick={() => go(entry)}
            >
              {formatCount(entry)}
            </button>
          ),
        )}
        <button type="button" className="pb-pager-btn" disabled={page >= pages} onClick={() => go(page + 1)} aria-label={t("dashboard.nextPage")}>
          <ArrowLeft2 size={16} />
        </button>
      </div>

      <div className="pb-pager-tools">
        {pages > 7 ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(event) => {
              event.preventDefault();
              const n = parseInt(jump.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))), 10);
              if (Number.isFinite(n)) go(n);
              setJump("");
            }}
          >
            <input
              value={jump}
              onChange={(event) => setJump(event.target.value)}
              inputMode="numeric"
              placeholder={t("dashboard.jumpToPage")}
              aria-label={t("dashboard.jumpToPage")}
              className="pb-pager-input"
            />
          </form>
        ) : null}
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <span className="hidden sm:inline">{t("dashboard.perPage")}</span>
          <select value={limit} onChange={(event) => onLimit(Number(event.target.value))} className="pb-pager-input !w-auto" aria-label={t("dashboard.perPage")}>
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {formatCount(size)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  );
}
