import "server-only";
import { isValidDate, zonedNow } from "@/lib/time";
import type { Appointment } from "@/lib/types";

/** Lê ?dia=YYYY-MM-DD com segurança (padrão: hoje). */
export function dayFromParams(dia: string | string[] | undefined): { date: string; today: string } {
  const today = zonedNow().date;
  const value = Array.isArray(dia) ? dia[0] : dia;
  return { date: value && isValidDate(value) ? value : today, today };
}

/** Marca quais atendimentos já começaram (libera concluído/falta). */
export function withStarted(list: Appointment[]) {
  const now = Date.now();
  return list.map((a) => ({ ...a, started: new Date(a.startAt).getTime() <= now }));
}
