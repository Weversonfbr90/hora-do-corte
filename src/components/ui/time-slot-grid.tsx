"use client";

import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";
import { Skeleton } from "./skeleton";

export interface TimeSlot {
  /** Ex.: "09:30" */
  time: string;
  available: boolean;
}

export interface TimeSlotGridProps {
  /** Rótulo do grupo, lido por leitores de tela (ex.: "Horários de terça, 18 de novembro"). */
  label: string;
  slots: TimeSlot[];
  value: string | null;
  onChange: (time: string) => void;
  loading?: boolean;
  /** Número de colunas no celular. No tablet/desktop a grade ganha colunas automaticamente. */
  columns?: 3 | 4;
  /** false = mantém o número de colunas em qualquer largura (útil em espaços estreitos). */
  responsive?: boolean;
}

/**
 * Grade de horários — escolha com um toque.
 * É um radiogroup: Tab entra/sai da grade inteira; setas movem entre horários livres
 * (←/→ na linha, ↑/↓ entre linhas); Home/End vão ao primeiro/último; Espaço/Enter escolhem.
 * Horários ocupados ficam visíveis (riscados), mas não recebem foco nem toque.
 */
export function TimeSlotGrid({ label, slots, value, onChange, loading, columns = 3, responsive = true }: TimeSlotGridProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const firstAvailable = slots.findIndex((s) => s.available);
  const selectedIndex = slots.findIndex((s) => s.time === value && s.available);
  // Só um item fica no ciclo do Tab (roving tabindex): o selecionado ou o primeiro livre.
  const tabStop = selectedIndex >= 0 ? selectedIndex : firstAvailable;

  const focusAt = (i: number) => refs.current[i]?.focus();

  const findAvailable = (from: number, step: number) => {
    for (let i = from + step; i >= 0 && i < slots.length; i += step) if (slots[i]?.available) return i;
    return -1;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const cols = Number(getComputedStyle(e.currentTarget.parentElement!).gridTemplateColumns.split(" ").length) || columns;
    let next = -1;
    switch (e.key) {
      case "ArrowRight": next = findAvailable(i, 1); break;
      case "ArrowLeft": next = findAvailable(i, -1); break;
      // ↓/↑: mesma coluna da linha de baixo/cima; se estiver ocupado, o próximo livre naquela direção.
      case "ArrowDown": next = findAvailable(i + cols - 1, 1); break;
      case "ArrowUp": next = findAvailable(i - cols + 1, -1); break;
      case "Home": next = firstAvailable; break;
      case "End": next = findAvailable(slots.length, -1); break;
      case " ":
      case "Enter":
        e.preventDefault();
        onChange(slots[i]!.time);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next >= 0) {
      focusAt(next);
      onChange(slots[next]!.time); // padrão radiogroup: mover = selecionar
    }
  };

  const gridCols = cn(columns === 4 ? "grid-cols-4" : "grid-cols-3", responsive && "sm:grid-cols-5 lg:grid-cols-6");

  if (loading) {
    return (
      <div role="status" aria-label="Carregando horários" className={cn("grid gap-2", gridCols)}>
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-touch rounded-md" />
        ))}
      </div>
    );
  }

  if (firstAvailable < 0) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface px-4 py-6 text-center">
        <p className="text-label text-fg">Nenhum horário livre neste dia</p>
        <p className="mt-1 text-helper text-fg-muted">Escolha outro dia ou outro barbeiro.</p>
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label={label} className={cn("grid gap-2", gridCols)}>
      {slots.map((slot, i) => {
        const selected = slot.time === value && slot.available;
        return (
          <button
            key={slot.time}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={!slot.available || undefined}
            aria-label={slot.available ? slot.time : `${slot.time}, ocupado`}
            tabIndex={slot.available && i === tabStop ? 0 : -1}
            onClick={() => slot.available && onChange(slot.time)}
            onKeyDown={(e) => slot.available && onKeyDown(e, i)}
            className={cn(
              "relative flex h-touch items-center justify-center gap-1 rounded-md border text-body font-semibold tabular-nums",
              "transition-[background-color,border-color,transform] duration-150 focus-visible:focus-ring",
              slot.available && !selected &&
                "border-border-strong bg-surface text-fg hover:border-fg hover:bg-accent-soft active:scale-[0.97]",
              selected && "border-2 border-fg bg-accent text-on-accent shadow-sm",
              !slot.available && "cursor-not-allowed border-transparent bg-surface-alt font-medium text-fg-disabled line-through",
            )}
          >
            {selected && <Icon name="confirmar" size={16} />}
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
