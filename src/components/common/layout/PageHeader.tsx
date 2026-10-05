import type { ReactNode } from "react";

/** Header for pages without a gradient hero: icon chip, title, subtitle, actions. */
export function PageHeader({
  icon,
  title,
  description,
  actions,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="pb-page-header">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? <span className="pb-page-header-icon">{icon}</span> : null}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight lg:text-3xl">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
