"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Alert, Button, TextField } from "@/components/ui";
import { authErrorMessage, requestPasswordReset } from "@/lib/auth-client";
import { emailSchema } from "@/lib/validation";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const check = emailSchema.safeParse({ email });
    if (!check.success) {
      setFieldError(check.error.issues[0]?.message);
      return;
    }
    setFieldError(undefined);
    setLoading(true);
    try {
      await requestPasswordReset(check.data.email);
      setSent(true);
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Por privacidade, "conta não existe" mostra a mesma mensagem de sucesso.
      if (code === "auth/user-not-found") setSent(true);
      else setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <title>Recuperar senha · Hora do corte</title>
      <div>
        <h1 className="text-h1">Recuperar senha</h1>
        <p className="mt-1 text-body text-fg-muted">Enviamos um link para você criar uma nova senha.</p>
      </div>
      {sent ? (
        <Alert tone="success" title="Pronto! Confira seu e-mail" live="polite">
          Se existir uma conta com <strong>{email.trim()}</strong>, o link chega em alguns minutos. Olhe também a caixa de spam.
        </Alert>
      ) : (
        <>
          {error && <Alert tone="danger" title={error} live="assertive" />}
          <TextField
            label="E-mail da conta"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
          />
          <Button type="submit" size="lg" fullWidth loading={loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </Button>
        </>
      )}
      <Link href="/entrar" className="mx-auto flex min-h-touch items-center rounded-md px-2 font-semibold text-accent-strong underline-offset-4 hover:underline focus-visible:focus-ring">
        Voltar para entrar
      </Link>
    </form>
  );
}
