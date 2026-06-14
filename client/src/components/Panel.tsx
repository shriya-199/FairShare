import type { ReactNode } from "react";

export function Panel({ title, action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-base font-semibold text-ink">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
