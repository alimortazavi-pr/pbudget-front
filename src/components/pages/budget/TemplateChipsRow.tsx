"use client";

import { Flash } from "iconsax-reactjs";

import type { ITransactionTemplate } from "@/common/interfaces/transaction-template.interface";
import { useTranslation } from "@/i18n";

type Props = {
  templates: ITransactionTemplate[];
  activeId: string;
  onApply: (template: ITransactionTemplate) => void;
  onManage: () => void;
  onCreate?: () => void;
};

/** One quiet, horizontally scrolling row of the user's templates (most used first). */
export function TemplateChipsRow({ templates, activeId, onApply, onManage, onCreate }: Props) {
  const { t } = useTranslation();
  if (!templates.length) {
    if (!onCreate) return null;
    return (
      <button
        type="button"
        onClick={onCreate}
        data-testid="template-create"
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-2 text-start text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent"
      >
        <Flash size={14} />
        <span className="font-semibold">{t("feat.templates.create")}</span>
        <span className="hidden sm:inline">· {t("feat.templates.createHint")}</span>
      </button>
    );
  }

  return (
    <div className="space-y-1.5" data-testid="template-chips">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <Flash size={14} />
          {t("feat.templates.row")}
        </p>
        <button type="button" onClick={onManage} className="text-xs font-semibold text-accent hover:underline">
          {t("feat.templates.manage")}
        </button>
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
      </div>
    </div>
  );
}
