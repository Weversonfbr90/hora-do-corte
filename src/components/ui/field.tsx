"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./icon";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}

/** Estrutura comum: rótulo acima, campo, mensagem auxiliar ou de erro abaixo. */
export function FieldShell({ id, label, hint, error, required, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label text-fg">
        {label}
        {required && (
          <span className="ml-1 font-normal text-fg-muted">
            (obrigatório)
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="flex items-start gap-1.5 text-helper font-medium text-danger">
          <Icon name="erro" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="text-helper text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlClasses =
  "w-full min-h-touch rounded-md border bg-surface px-4 text-body text-fg placeholder:text-fg-muted " +
  "transition-[border-color,box-shadow] duration-150 " +
  "hover:border-fg focus-visible:outline-none focus-visible:border-focus focus-visible:ring-[3px] focus-visible:ring-focus/30 " +
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-alt disabled:text-fg-disabled disabled:hover:border-border " +
  "read-only:bg-surface-alt";

export const controlState = (error?: string) =>
  error
    ? "border-danger border-2 focus-visible:border-danger focus-visible:ring-danger/25"
    : "border-border-strong";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  hint?: string;
  error?: string;
  /** Ícone decorativo à esquerda. */
  leadingIcon?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, leadingIcon, id, required, className, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required}>
      <div className="relative">
        {leadingIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-fg-muted">{leadingIcon}</span>
        )}
        <input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
          className={cn(controlClasses, controlState(error), leadingIcon ? "pl-11" : undefined, className)}
          {...rest}
        />
      </div>
    </FieldShell>
  );
});

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, hint, error, id, required, className, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldShell id={fieldId} label={label} hint={hint} error={error} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-msg` : undefined}
        className={cn(controlClasses, controlState(error), "py-3 leading-6", className)}
        {...rest}
      />
    </FieldShell>
  );
});
