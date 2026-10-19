"use client";

import Link from "next/link";
import { Add, Flash } from "iconsax-reactjs";

import { PATHS } from "@/common/constants";
import type { ITransactionTemplate } from "@/common/interfaces/transaction-template.interface";
import { useTranslation } from "@/i18n";

type Props = {
  templates: ITransactionTemplate[];
  activeId: string;
  onApply: (template: ITransactionTemplate) => void;
};

/** One quiet, horizontally scrolling row of the user's templates (most used first). Hidden without templates. */
export function TemplateChipsRow({ templates, activeId, onApply }: Props) {
  const { t } = useTranslation();
  if (!templates.length) return null;

  return (
    <div className="space-y-1.5" data-testid="template-chips">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Flash size={14} />
          {t("feat.templates.row")}
        </p>
        <Link href={PATHS.TEMPLATES} className="text-xs font-semibold text-accent hover:underline">
          {t("feat.templates.manage")}
        </Link>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {templates.map((template) => {
          const active = template._id === activeId;
          return (
            <button
              key={template._id}
              type="button"
              aria-pressed={active}
              onClick={() => onApply(template)}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active
                  ? "border-accent bg-accent/15 font-semibold text-accent"
                  : "border-border/60 bg-surface-secondary text-foreground hover:border-accent/40"
              }`}
            >
              <span
                aria-hidden
                className={`me-1.5 inline-block size-1.5 rounded-full align-middle ${
                  template.type === 0 ? "bg-[var(--brand-teal)]" : "bg-[var(--brand-rose)]"
                }`}
              />
              {template.title}
            </button>
          );
        })}
        <Link
          href={`${PATHS.TEMPLATES}?new=1`}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-dashed border-border/70 px-3 py-1.5 text-sm text-muted hover:border-accent/50 hover:text-accent"
        >
          <Add size={14} />
          {t("feat.templates.newChip")}
        </Link>
      </div>
    </div>
  );
}
