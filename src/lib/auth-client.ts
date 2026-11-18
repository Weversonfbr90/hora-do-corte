"use client";

import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { clientAuth } from "./firebase-client";

/** Mensagens em português para os códigos do Firebase Auth. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "E-mail ou senha incorretos.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/user-disabled":
      return "Seu acesso está suspenso. Fale com a barbearia.";
    case "auth/too-many-requests":
      return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
    case "auth/network-request-failed":
      return "Sem conexão com a internet. Confira e tente de novo.";
    default:
      return "Não foi possível entrar agora. Tente de novo.";
  }
}

/** Entra no Firebase e troca o token por um cookie de sessão. Retorna a tela inicial do perfil. */
export async function signInAndCreateSession(email: string, password: string): Promise<string> {
  const auth = clientAuth();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const idToken = await cred.user.getIdToken();
  const res = await fetch("/api/sessao", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const body = (await res.json().catch(() => ({}))) as { redirectTo?: string; error?: string };
  // O token do navegador não é mais necessário: a sessão é o cookie httpOnly.
  await signOut(auth).catch(() => {});
  if (!res.ok || !body.redirectTo) {
    throw Object.assign(new Error(body.error || "Falha ao criar a sessão."), { code: "app/session", userMessage: body.error });
  }
  return body.redirectTo;
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(clientAuth(), email.trim(), { url: `${window.location.origin}/entrar` });
}

export async function endSession(): Promise<void> {
  await fetch("/api/sessao", { method: "DELETE" });
}
