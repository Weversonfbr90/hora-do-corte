"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, Button, Icon, TextField } from "@/components/ui";
import { authErrorMessage, signInAndCreateSession } from "@/lib/auth-client";
import { formatPhone } from "@/lib/format";
import { fieldErrors, signUpSchema } from "@/lib/validation";
import { criarConta } from "@/server/actions/conta";

export function SignUpForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "phone" ? formatPhone(e.target.value) : e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    // Validação imediata no navegador (a mesma regra é aplicada de novo no servidor).
    const check = signUpSchema.safeParse(form);
    if (!check.success) {
      setErrors(fieldErrors(check.error));
      return;
    }
    setErrors({});
    setLoading(true);
    const res = await criarConta(form);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      setError(res.error);
      setLoading(false);
      return;
    }
    try {
      const to = await signInAndCreateSession(form.email, form.password);
      router.replace(to);
      router.refresh();
    } catch (err) {
      setError(`Conta criada, mas não foi possível entrar: ${authErrorMessage(err)}`);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="text-h1">Criar conta</h1>
        <p className="mt-1 text-body text-fg-muted">Leva menos de um minuto.</p>
      </div>
      {error && <Alert tone="danger" title={error} live="assertive" />}
      <TextField label="Nome" required autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} />
      <TextField
        label="Celular (WhatsApp)"
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(11) 91234-5678"
        leadingIcon={<Icon name="telefone" />}
        value={form.phone}
        onChange={set("phone")}
        error={errors.phone}
        hint="A barbearia usa para falar com você, se precisar."
      />
      <TextField
        label="E-mail"
        required
        type="email"
        inputMode="email"
        autoComplete="email"
        value={form.email}
        onChange={set("email")}
        error={errors.email}
      />
      <TextField
        label="Senha"
        required
        type="password"
        autoComplete="new-password"
        value={form.password}
        onChange={set("password")}
        error={errors.password}
        hint="Pelo menos 8 caracteres."
      />
      <Button type="submit" size="lg" fullWidth loading={loading}>
        {loading ? "Criando conta…" : "Criar conta"}
      </Button>
      <p className="text-center text-body text-fg-muted">
        Já tem conta?{" "}
        <Link href="/entrar" className="inline-flex min-h-touch items-center rounded-md px-1 font-semibold text-accent-strong underline-offset-4 hover:underline focus-visible:focus-ring">
          Entrar
        </Link>
      </p>
    </form>
  );
}
