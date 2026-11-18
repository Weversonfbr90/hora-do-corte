"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Icon, IconButton, Spinner } from "@/components/ui";
import { controlClasses } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { addDays, formatDateLong, relativeDayLabel } from "@/lib/time";

/** Troca de dia: anterior / escolher data / próximo / hoje. Atualiza ?dia= na URL. */
export function DayNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  const go = (d: string) => {
    if (!d) return;
    const next = new URLSearchParams(params.toString());
    if (d === today) next.delete("dia");
    else next.set("dia", d);
    start(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <IconButton label="Dia anterior" variant="secondary" onClick={() => go(addDays(date, -1))}>
          <Icon name="anterior" size={24} />
        </IconButton>
        <label className="sr-only" htmlFor="dia-escolhido">Escolher dia</label>
        <input
          id="dia-escolhido"
          type="date"
          value={date}
          onChange={(e) => go(e.target.value)}
          className={cn(controlClasses, "border-border-strong max-w-48 flex-1 tabular-nums")}
        />
        <IconButton label="Próximo dia" variant="secondary" onClick={() => go(addDays(date, 1))}>
          <Icon name="proximo" size={24} />
        </IconButton>
        {date !== today && (
          <button type="button" onClick={() => go(today)} className="min-h-touch rounded-lg px-3 text-label text-accent-strong hover:bg-surface-alt focus-visible:focus-ring">
            Hoje
          </button>
        )}
        {pending && <Spinner className="text-fg-muted" />}
      </div>
      <p className="text-h3 first-letter:uppercase" aria-live="polite">
        {relativeDayLabel(date, today) === formatDateLong(date) ? formatDateLong(date) : `${relativeDayLabel(date, today)} · ${formatDateLong(date)}`}
      </p>
    </div>
  );
}
