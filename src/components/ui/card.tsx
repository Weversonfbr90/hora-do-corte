import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

/* ------------------------------------------------------------------ */
/* Card                                                                 */
/* ------------------------------------------------------------------ */

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** "flat" = só borda (listas) · "raised" = borda + sombra (destaques) · "inverse" = fundo carvão. */
  tone?: "flat" | "raised" | "inverse";
  padding?: "md" | "lg";
}

export function Card({ tone = "flat", padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg",
        tone === "flat" && "border border-border bg-surface",
        tone === "raised" && "border border-border bg-surface shadow-md",
        tone === "inverse" && "bg-surface-inverse text-fg-inverse",
        padding === "md" ? "p-4" : "p-6",
        className,
      )}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------------ */
/* SelectableCard — cartão que é uma opção (serviço, barbeiro)          */
/* ------------------------------------------------------------------ */

interface SelectableCardProps {
  title: string;
  description?: string;
  meta?: ReactNode;
  leading?: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  /** Use "radio" dentro de um grupo de escolha única. */
  role?: "radio" | "checkbox";
}

export function SelectableCard({ title, description, meta, leading, selected, disabled, onSelect, role = "radio" }: SelectableCardProps) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex w-full min-h-touch-lg items-center gap-4 rounded-lg p-4 text-left transition-[background-color,border-color,box-shadow] duration-150",
        "focus-visible:focus-ring",
        selected
          ? "border-2 border-fg bg-accent-soft shadow-sm"
          : "border border-border bg-surface hover:border-border-strong hover:bg-surface-alt",
        "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-alt disabled:shadow-none",
        // Mantém o conteúdo no lugar quando a borda engrossa.
        !selected && "m-px w-[calc(100%-2px)]",
      )}
    >
      {leading}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn("text-h3", disabled ? "text-fg-disabled" : "text-fg")}>{title}</span>
        {description && <span className={cn("text-helper", disabled ? "text-fg-disabled" : "text-fg-muted")}>{description}</span>}
      </span>
      {meta && <span className={cn("shrink-0 text-label", disabled ? "text-fg-disabled" : "text-fg")}>{meta}</span>}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-fg bg-primary text-on-primary" : "border-border-strong",
          disabled && "border-border",
        )}
      >
        {selected && <Icon name="confirmar" size={16} strokeWidth={2.5} />}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                                */
/* ------------------------------------------------------------------ */

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "leather";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-alt text-fg",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  leather: "bg-brand-leather-soft text-brand-leather",
};

/** Status curto. Sempre texto + cor (nunca só cor). */
export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-helper font-semibold", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar — iniciais (sem fotos inventadas)                             */
/* ------------------------------------------------------------------ */

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-leather-soft font-bold text-brand-leather",
        size === "sm" && "size-8 text-helper",
        size === "md" && "size-12 text-body",
        size === "lg" && "size-16 text-h3",
      )}
    >
      {initials}
    </span>
  );
}
