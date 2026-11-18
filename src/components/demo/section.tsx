import type { ReactNode } from "react";

export function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-20 border-t border-border py-10 first:border-t-0 sm:py-14">
      <h2 id={`${id}-titulo`} className="text-h1">{title}</h2>
      {intro && <p className="mt-2 max-w-3xl text-body-lg text-fg-muted">{intro}</p>}
      <div className="mt-6 flex flex-col gap-8">{children}</div>
    </section>
  );
}

export function Sub({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-h3">{title}</h3>
      {note && <p className="-mt-2 text-helper text-fg-muted">{note}</p>}
      {children}
    </div>
  );
}

/** Rótulo de estado acima de um exemplo. */
export function StateLabel({ children }: { children: ReactNode }) {
  return <span className="text-overline uppercase text-fg-muted">{children}</span>;
}
