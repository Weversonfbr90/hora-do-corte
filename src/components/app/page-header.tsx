import type { ReactNode } from "react";

/** Título de página padrão: h1 + descrição opcional + ação à direita (no desktop). */
export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-h1">{title}</h1>
        {description && <p className="mt-1 text-body text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Estado vazio padrão. */
export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-10 text-center">
      <p className="text-h3">{title}</p>
      {children && <div className="max-w-sm text-body text-fg-muted">{children}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
