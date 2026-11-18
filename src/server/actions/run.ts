import "server-only";
import { ZodError } from "zod";
import { fieldErrors } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";
import { BookingError } from "../booking";
import { AuthError } from "../session";

/**
 * Executa a lógica de uma Server Action e converte erros conhecidos em mensagens amigáveis.
 * Erros inesperados são registrados no servidor e viram uma mensagem genérica (sem vazar detalhes).
 */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data } as ActionResult<T>;
  } catch (err) {
    if (err instanceof ZodError) {
      const fe = fieldErrors(err);
      return { ok: false, error: Object.values(fe)[0] ?? "Confira os campos.", fieldErrors: fe };
    }
    if (err instanceof BookingError || err instanceof AuthError || err instanceof UserError) {
      return { ok: false, error: err.message };
    }
    console.error("[acao] erro inesperado:", err);
    return { ok: false, error: "Não foi possível concluir agora. Tente de novo em instantes." };
  }
}

/** Erro de validação/regra com mensagem para o usuário. */
export class UserError extends Error {}
