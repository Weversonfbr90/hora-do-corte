"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconButton } from "./button";
import { Icon } from "./icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Botões de rodapé. No celular empilham com a ação principal por último (perto do polegar). */
  footer?: ReactNode;
}

/**
 * Modal acessível sobre o <dialog> nativo:
 * - showModal() prende o foco dentro e deixa o resto da página inerte;
 * - Esc fecha; tocar no fundo escuro fecha;
 * - ao fechar, o foco volta para o elemento que abriu.
 * No celular vira "folha inferior" (sobe da base, alcançável com o polegar); no desktop fica centralizado.
 */
export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      (opener.current as HTMLElement | null)?.focus?.();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      className={cn(
        "m-0 mt-auto w-full max-w-none bg-surface p-0 text-fg shadow-lg",
        "rounded-t-xl backdrop:bg-carvao-950/50",
        "sm:m-auto sm:max-w-md sm:rounded-xl",
        "open:animate-[sheet-in_200ms_var(--ease-standard)]",
      )}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-creme-200 sm:hidden" />
        <header className="flex items-start gap-3 px-5 pt-4 pb-2 sm:px-6 sm:pt-6">
          <div className="flex-1">
            <h2 id={titleId} className="text-h2">{title}</h2>
            {description && <p id={descId} className="mt-1 text-body text-fg-muted">{description}</p>}
          </div>
          <IconButton label="Fechar" onClick={onClose} className="-mt-2 -mr-2">
            <Icon name="fechar" size={24} />
          </IconButton>
        </header>
        {children && <div className="overflow-y-auto px-5 py-2 sm:px-6">{children}</div>}
        {footer && (
          <footer className="flex flex-col-reverse gap-2 px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:pb-6">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
