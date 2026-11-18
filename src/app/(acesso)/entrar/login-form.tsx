"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, TextField } from "@/components/ui";
import { authErrorMessage, signInAndCreateSession } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const fe: typeof errors = {};
    if (!email.trim()) fe.email = "Informe o e-mail.";
    if (!password) fe.password = "Informe a senha.";
    setErrors(fe);
    setError(null);
    if (fe.email || fe.password) return;

    setLoading(true);
    try {
      const to = await signInAndCreateSession(email, password);
      router.replace(to);
      router.refresh();
    } catch (err) {
      setError((err as { userMessage?: string }).userMessage ?? authErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <h1 className="text-h1">Entrar</h1>
      {params.get("senha") === "enviada" && (
        <Alert tone="success" title="Link enviado">
          Se o e-mail tiver conta, você vai receber um link para criar uma nova senha.
        </Alert>
      )}
      {error && <Alert tone="danger" title={error} live="assertive" />}
      <TextField
        label="E-mail"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      <Button type="submit" size="lg" fullWidth loading={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>
      <div className="flex flex-col items-center gap-1 text-body">
        <Link href="/recuperar-senha" className="flex min-h-touch items-center rounded-md px-2 font-semibold text-accent-strong underline-offset-4 hover:underline focus-visible:focus-ring">
          Esqueci minha senha
        </Link>
        <p className="text-fg-muted">
          Ainda não tem conta?{" "}
          <Link href="/criar-conta" className="inline-flex min-h-touch items-center rounded-md px-1 font-semibold text-accent-strong underline-offset-4 hover:underline focus-visible:focus-ring">
            Criar conta
          </Link>
        </p>
      </div>
    </form>
  );
}
