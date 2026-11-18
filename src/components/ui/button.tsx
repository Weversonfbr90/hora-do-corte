import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "accent" | "ghost" | "danger";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mostra o spinner, bloqueia cliques e anuncia "carregando" para leitores de tela. */
  loading?: boolean;
  /** Ícone à esquerda do texto (use ícones de `@/components/ui/icon`). */
  icon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "relative inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-standard " +
  "focus-visible:focus-ring active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:active:scale-100 " +
  "aria-busy:cursor-progress aria-busy:active:scale-100";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-sm hover:bg-primary-hover active:bg-primary-active " +
    "disabled:bg-surface-alt disabled:text-fg-disabled disabled:shadow-none",
  secondary:
    "border border-border-strong bg-surface text-fg hover:bg-surface-alt active:bg-creme-200 " +
    "disabled:border-border disabled:bg-surface disabled:text-fg-disabled",
  accent:
    "bg-accent text-on-accent shadow-sm hover:bg-accent-hover active:bg-accent-active " +
    "disabled:bg-surface-alt disabled:text-fg-disabled disabled:shadow-none",
  ghost:
    "bg-transparent text-fg hover:bg-surface-alt active:bg-creme-200 disabled:text-fg-disabled disabled:bg-transparent",
  danger:
    "border border-danger bg-surface text-danger hover:bg-danger-soft active:bg-danger/15 " +
    "disabled:border-border disabled:text-fg-disabled disabled:bg-surface",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-touch px-5 text-body",
  lg: "min-h-touch-lg px-6 text-body-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, icon, fullWidth, className, children, disabled, onClick, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      // Durante o carregamento o botão continua focável (não perde a posição do foco), mas ignora cliques.
      onClick={loading ? (e) => e.preventDefault() : onClick}
      className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
      {...rest}
    >
      {loading ? <Spinner className="size-5" /> : icon}
      <span className={cn(loading && "opacity-90")}>{children}</span>
      {loading && <span className="sr-only">Carregando</span>}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto obrigatório: vira o nome acessível do botão. */
  label: string;
  children: ReactNode;
  variant?: "ghost" | "secondary";
}

/** Botão só com ícone. Sempre 48×48 px de área de toque. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, variant = "ghost", className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-touch items-center justify-center rounded-full text-fg transition-colors duration-150",
        "focus-visible:focus-ring disabled:cursor-not-allowed disabled:text-fg-disabled",
        variant === "ghost" ? "hover:bg-surface-alt" : "border border-border-strong bg-surface hover:bg-surface-alt",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
