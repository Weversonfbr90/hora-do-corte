"use server";

import { FieldValue } from "firebase-admin/firestore";
import { signUpSchema } from "@/lib/validation";
import { adminAuth, db } from "../firebase-admin";
import { run, UserError } from "./run";

/**
 * US-01 — Cria a conta no servidor (validação garantida) e o perfil como CLIENTE.
 * Depois o navegador entra com e-mail e senha e troca o token por um cookie de sessão.
 */
export async function criarConta(input: { name: string; phone: string; email: string; password: string }) {
  return run(async () => {
    const data = signUpSchema.parse(input);
    let uid: string;
    try {
      const user = await adminAuth().createUser({
        email: data.email,
        password: data.password,
        displayName: data.name,
      });
      uid = user.uid;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-exists") {
        throw new UserError("Já existe uma conta com esse e-mail. Tente entrar ou recuperar a senha.");
      }
      if (code === "auth/invalid-password") throw new UserError("A senha precisa ter pelo menos 8 caracteres.");
      if (code === "auth/invalid-email") throw new UserError("E-mail inválido.");
      throw err;
    }
    await db().collection("users").doc(uid).set({
      name: data.name,
      phone: data.phone,
      email: data.email,
      role: "cliente",
      status: "ativo",
      createdAt: FieldValue.serverTimestamp(),
    });
    return undefined;
  });
}
