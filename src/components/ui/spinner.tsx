import { cn } from "@/lib/cn";

/** Indicador de carregamento. Decorativo: o estado é anunciado pelo componente pai (aria-busy). */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-5 animate-spin motion-reduce:animate-[spin_1.5s_linear_infinite]", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
