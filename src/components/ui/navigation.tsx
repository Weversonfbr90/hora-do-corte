"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";
import { IconButton } from "./button";

/* ------------------------------------------------------------------ */
/* TopBar — cabeçalho de tela (celular)                                 */
/* ------------------------------------------------------------------ */

interface TopBarProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

export function TopBar({ title, onBack, action }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-1 border-b border-border bg-bg/95 px-2 backdrop-blur">
      {onBack ? (
        <IconButton label="Voltar" onClick={onBack}>
          <Icon name="voltar" size={24} />
        </IconButton>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="flex-1 truncate text-h3">{title}</h1>
      {action}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Wordmark — marca em texto (sem símbolo, a pedido do briefing)        */
/* ------------------------------------------------------------------ */

export function Wordmark({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <span className={cn("text-h3 font-extrabold tracking-tight", inverse ? "text-fg-inverse" : "text-fg", className)}>
      Hora do corte
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* BottomNav — navegação principal no celular (área do polegar)         */
/* ------------------------------------------------------------------ */

export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
}

interface BottomNavProps {
  items: NavItem[];
  current: string;
  onNavigate: (id: string) => void;
  /** Use "static" na demonstração; "fixed" no app. */
  position?: "fixed" | "static";
}

/** 3 a 5 destinos, sempre com ícone + texto. O item atual recebe aria-current="page". */
export function BottomNav({ items, current, onNavigate, position = "fixed" }: BottomNavProps) {
  return (
    <nav
      aria-label="Principal"
      className={cn(
        "border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]",
        position === "fixed" && "fixed inset-x-0 bottom-0 z-20 md:hidden",
      )}
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = item.id === current;
          return (
            <li key={item.id} className="flex-1">
              <a
                href={item.href ?? `#${item.id}`}
                aria-current={active ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
                className={cn(
                  "group flex min-h-16 flex-col items-center justify-center gap-1 text-helper transition-colors focus-visible:focus-ring focus-visible:-outline-offset-4",
                  active ? "font-bold text-fg" : "font-medium text-fg-muted hover:text-fg",
                )}
              >
                <span className={cn("flex h-8 w-16 items-center justify-center rounded-full transition-colors", active ? "bg-accent" : "group-hover:bg-surface-alt")}>
                  <Icon name={item.icon} size={24} />
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* SideNav — navegação no tablet/desktop (painel do dono)               */
/* ------------------------------------------------------------------ */

export function SideNav({ items, current, onNavigate }: Omit<BottomNavProps, "position">) {
  return (
    <nav aria-label="Principal" className="flex h-full w-64 flex-col gap-6 bg-surface-inverse p-4 text-fg-inverse">
      <Wordmark inverse className="px-3 pt-2" />
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const active = item.id === current;
          return (
            <li key={item.id}>
              <a
                href={item.href ?? `#${item.id}`}
                aria-current={active ? "page" : undefined}
                onClick={(e) => { e.preventDefault(); onNavigate(item.id); }}
                className={cn(
                  "flex min-h-touch items-center gap-3 rounded-md px-3 text-body transition-colors",
                  "focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2",
                  active ? "bg-accent font-bold text-on-accent" : "text-fg-inverse hover:bg-carvao-800",
                )}
              >
                <Icon name={item.icon} size={24} />
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs — alternar visões na mesma tela (ex.: Hoje / Semana)            */
/* ------------------------------------------------------------------ */

interface TabsProps {
  label: string;
  tabs: { id: string; label: string }[];
  current: string;
  onChange: (id: string) => void;
  /** Prefixo para ligar cada aba ao seu painel: o painel deve ter id={`${idPrefix}-panel-${tab.id}`}. */
  idPrefix: string;
}

/** Padrão ARIA Tabs com ativação automática: ←/→ trocam de aba, Home/End. */
export function Tabs({ label, tabs, current, onChange, idPrefix }: TabsProps) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(tabs[next]!.id);
  };

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-lg bg-surface-alt p-1">
      {tabs.map((tab, i) => {
        const selected = tab.id === current;
        return (
          <button
            key={tab.id}
            ref={(el) => { refs.current[i] = el; }}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "min-h-touch flex-1 rounded-md px-4 text-label transition-colors focus-visible:focus-ring",
              selected ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
