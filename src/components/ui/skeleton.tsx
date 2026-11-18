import { cn } from "@/lib/cn";

/**
 * Bloco de carregamento. Decorativo (aria-hidden): o contêiner pai deve ter
 * role="status" + aria-label (ex.: "Carregando horários").
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-surface-alt)_0%,var(--color-creme-200)_50%,var(--color-surface-alt)_100%)] bg-size-[200%_100%]",
        className,
      )}
    />
  );
}

/** Esqueleto pronto de um cartão de agendamento. */
export function AppointmentCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3.5 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}
