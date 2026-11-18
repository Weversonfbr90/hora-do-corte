"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { controlClasses, controlState } from "./field";
import { Icon } from "./icon";

export interface SelectOption {
  value: string;
  label: string;
  /** Linha secundária (ex.: duração e preço do serviço). */
  description?: string;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Seletor personalizado (padrão ARIA "select-only combobox").
 * Teclado: Enter/Espaço/↓ abre · ↑/↓ move · Home/End vão ao início/fim ·
 * Enter/Espaço escolhem · Esc fecha sem mudar · Tab fecha e segue · digitar uma letra pula para a opção.
 */
export function Select({ label, options, value, onChange, placeholder = "Selecione", hint, error, disabled, required }: SelectProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(Math.max(selectedIndex, 0));
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options[selectedIndex];

  // Fecha ao tocar fora.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Mantém a opção ativa visível.
  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const enabledIndexes = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const move = (dir: 1 | -1) => {
    const pos = enabledIndexes.indexOf(active);
    const next = enabledIndexes[Math.min(Math.max(pos + dir, 0), enabledIndexes.length - 1)];
    if (next !== undefined) setActive(next);
  };
  const openList = () => {
    setActive(selectedIndex >= 0 ? selectedIndex : (enabledIndexes[0] ?? 0));
    setOpen(true);
  };
  const choose = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (open) move(1);
        else openList();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) move(-1);
        else openList();
        break;
      case "Home":
        if (open) { e.preventDefault(); setActive(enabledIndexes[0] ?? 0); }
        break;
      case "End":
        if (open) { e.preventDefault(); setActive(enabledIndexes.at(-1) ?? 0); }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else openList();
        break;
      case "Escape":
        if (open) { e.preventDefault(); setOpen(false); }
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const i = options.findIndex((o) => !o.disabled && o.label.toLowerCase().startsWith(e.key.toLowerCase()));
          if (i >= 0) { setActive(i); if (!open) setOpen(true); }
        }
    }
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-1.5">
      <span id={`${id}-label`} className="text-label text-fg">
        {label}
        {required && <span className="ml-1 font-normal text-fg-muted">(obrigatório)</span>}
      </span>
      <div className="relative">
        <button
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          disabled={disabled}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onKeyDown}
          className={cn(controlClasses, controlState(error), "flex items-center justify-between gap-3 text-left", open && "border-focus")}
        >
          <span id={`${id}-value`} className={cn("truncate", !selected && "text-fg-muted")}>
            {selected ? selected.label : placeholder}
          </span>
          <Icon name="expandir" className={cn("shrink-0 transition-transform duration-150", open && "rotate-180")} />
        </button>

        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={`${id}-label`}
          tabIndex={-1}
          hidden={!open}
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-72 overflow-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onPointerEnter={() => !opt.disabled && setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "flex min-h-touch cursor-pointer items-center gap-3 rounded-md px-3 py-2",
                  i === active && !opt.disabled && "bg-surface-alt outline-2 -outline-offset-2 outline-focus",
                  isSelected && "font-semibold",
                  opt.disabled && "cursor-not-allowed text-fg-disabled",
                )}
              >
                <span className="flex-1">
                  <span className="block">{opt.label}</span>
                  {opt.description && (
                    <span className={cn("block text-helper", opt.disabled ? "text-fg-disabled" : "text-fg-muted")}>
                      {opt.description}
                    </span>
                  )}
                </span>
                {isSelected && <Icon name="confirmar" className="shrink-0 text-accent-strong" />}
              </li>
            );
          })}
        </ul>
      </div>
      {error ? (
        <p id={`${id}-msg`} className="flex items-start gap-1.5 text-helper font-medium text-danger">
          <Icon name="erro" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-helper text-fg-muted">{hint}</p>
      ) : null}
    </div>
  );
}
