"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/* ------------------------------------------------------------------ */
/* ChipGroup — escolha única em pílulas (ex.: filtro de dia, serviço)  */
/* ------------------------------------------------------------------ */

export interface ChipOption {
  value: string;
  label: string;
  /** Segunda linha opcional (ex.: dia da semana sobre a data). */
  sublabel?: string;
  disabled?: boolean;
}

interface ChipGroupProps {
  label: string;
  options: ChipOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** "scroll" = faixa horizontal rolável (datas no celular). */
  layout?: "wrap" | "scroll";
}

/** Radiogroup com roving tabindex. Setas ←/→ movem e selecionam; Home/End. */
export function ChipGroup({ label, options, value, onChange, layout = "wrap" }: ChipGroupProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.value === value && !o.disabled);
  const tabStop = selectedIndex >= 0 ? selectedIndex : enabled[0];

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const pos = enabled.indexOf(i);
    let next: number | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = enabled[(pos + 1) % enabled.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled.at(-1);
    else return;
    e.preventDefault();
    if (next !== undefined) {
      refs.current[next]?.focus();
      onChange(options[next]!.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex gap-2",
        layout === "wrap" ? "flex-wrap" : "-mx-4 snap-x overflow-x-auto px-4 pb-1 [scrollbar-width:none]",
      )}
    >
      {options.map((opt, i) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={opt.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "flex shrink-0 snap-start flex-col items-center justify-center rounded-lg border px-4 transition-colors duration-150 focus-visible:focus-ring",
              opt.sublabel ? "min-h-16 min-w-16 py-2" : "min-h-touch",
              selected
                ? "border-2 border-fg bg-primary text-on-primary"
                : "border-border-strong bg-surface text-fg hover:bg-surface-alt",
              "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-alt disabled:text-fg-disabled",
            )}
          >
            {opt.sublabel && (
              <span className={cn("text-overline uppercase", selected ? "text-fg-inverse" : "text-fg-muted", opt.disabled && "text-fg-disabled")}>
                {opt.sublabel}
              </span>
            )}
            <span className="text-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Checkbox                                                             */
/* ------------------------------------------------------------------ */

interface CheckboxProps {
  label: ReactNode;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string;
}

export function Checkbox({ label, description, checked, onChange, disabled, error }: CheckboxProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className={cn("group flex min-h-touch cursor-pointer items-start gap-3 py-2", disabled && "cursor-not-allowed")}
      >
        <span className="relative mt-0.5 flex size-6 shrink-0 items-center justify-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : description ? `${id}-desc` : undefined}
            onChange={(e) => onChange(e.target.checked)}
            className={cn(
              "peer size-6 cursor-pointer appearance-none rounded-sm border-2 bg-surface transition-colors duration-150",
              "checked:border-primary checked:bg-primary focus-visible:focus-ring",
              "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-alt disabled:checked:bg-fg-disabled",
              error ? "border-danger" : "border-border-strong group-hover:border-fg",
            )}
          />
          <Icon name="confirmar" size={16} strokeWidth={2.5} className="pointer-events-none absolute text-on-primary opacity-0 peer-checked:opacity-100" />
        </span>
        <span className="flex flex-col">
          <span className={cn("text-body", disabled ? "text-fg-disabled" : "text-fg")}>{label}</span>
          {description && (
            <span id={`${id}-desc`} className={cn("text-helper", disabled ? "text-fg-disabled" : "text-fg-muted")}>
              {description}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={`${id}-err`} className="ml-9 text-helper font-medium text-danger">{error}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Switch — liga/desliga com efeito imediato (ex.: "Aceitar agendamentos") */
/* ------------------------------------------------------------------ */

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, description, checked, onChange, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex min-h-touch items-center justify-between gap-4 py-2">
      <span className="flex flex-col">
        <label htmlFor={id} className={cn("text-body font-medium", disabled ? "text-fg-disabled" : "text-fg")}>
          {label}
        </label>
        {description && <span id={`${id}-desc`} className="text-helper text-fg-muted">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          // Área de toque 48px; trilho visual 52×32.
          "relative inline-flex h-touch w-16 shrink-0 cursor-pointer items-center justify-center focus-visible:outline-none",
          "group disabled:cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "relative h-8 w-13 rounded-full border-2 transition-colors duration-150 group-focus-visible:focus-ring",
            checked ? "border-primary bg-primary" : "border-border-strong bg-surface-alt",
            "group-disabled:border-border group-disabled:bg-surface-alt",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 flex size-6 items-center justify-center rounded-full shadow-sm transition-transform duration-150 ease-standard",
              checked ? "translate-x-5 bg-accent text-on-accent" : "bg-surface text-fg-muted",
              "group-disabled:bg-creme-200",
            )}
          >
            {checked && <Icon name="confirmar" size={16} strokeWidth={2.5} />}
          </span>
        </span>
      </button>
    </div>
  );
}
