import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "./icon";

export type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<AlertTone, { box: string; icon: IconName; label: string }> = {
  info: { box: "bg-info-soft text-info border-info/30", icon: "info", label: "Informação" },
  success: { box: "bg-success-soft text-success border-success/30", icon: "sucesso", label: "Sucesso" },
  warning: { box: "bg-warning-soft text-warning border-warning/30", icon: "aviso", label: "Atenção" },
  danger: { box: "bg-danger-soft text-danger border-danger/30", icon: "erro", label: "Erro" },
};

interface AlertProps {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  /** Botão de ação opcional (ex.: "Tentar de novo"). */
  action?: ReactNode;
  onDismiss?: () => void;
  /**
   * "polite" para avisos que surgem após uma ação (status); "assertive" só para erros
   * que bloqueiam a tarefa (alert). Sem a prop, o alerta é estático (já estava na tela).
   */
  live?: "polite" | "assertive";
}

export function Alert({ tone = "info", title, children, action, onDismiss, live }: AlertProps) {
  const t = tones[tone];
  return (
    <div
      role={live === "assertive" ? "alert" : live === "polite" ? "status" : undefined}
      className={cn("flex gap-3 rounded-lg border p-4", t.box)}
    >
      <Icon name={t.icon} size={24} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-label">
          <span className="sr-only">{t.label}: </span>
          {title}
        </p>
        {children && <div className="text-helper text-fg">{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar aviso"
          className="-m-2 flex size-touch shrink-0 items-center justify-center rounded-full text-fg hover:bg-white/60 focus-visible:focus-ring"
        >
          <Icon name="fechar" />
        </button>
      )}
    </div>
  );
}
