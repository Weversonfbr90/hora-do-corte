/**
 * Datas e horários no fuso da barbearia.
 * Convenções:
 *  - Data: string "YYYY-MM-DD" (dia no fuso da barbearia).
 *  - Hora: minutos desde a meia-noite (ex.: 9h30 = 570).
 */

export const TIMEZONE = "America/Sao_Paulo";
export const MAX_DAYS_AHEAD = 30;
export const CHANGE_LIMIT_MIN = 120; // cancelar/remarcar até 2 horas antes

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Partes de data/hora de um instante no fuso da barbearia. */
function zonedParts(instant: Date, timeZone = TIMEZONE) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p = Object.fromEntries(fmt.formatToParts(instant).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** "Agora" no fuso da barbearia. */
export function zonedNow(now: Date = new Date()): { date: string; minutes: number } {
  const p = zonedParts(now);
  return { date: `${p.year}-${pad(p.month)}-${pad(p.day)}`, minutes: p.hour * 60 + p.minute };
}

/** Converte data + minutos (no fuso da barbearia) para um instante UTC. */
export function toInstant(date: string, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  // Descobre o deslocamento do fuso naquele momento e corrige.
  const p = zonedParts(new Date(guess));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const offset = asUtc - guess;
  return new Date(guess - offset);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** 0 = domingo … 6 = sábado */
export function weekday(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** 570 → "09:30" */
export function minutesToTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/** "09:30" → 570 (ou NaN se inválido) */
export function timeToMinutes(time: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(time);
  if (!m) return NaN;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return NaN;
  return h * 60 + mi;
}

/** Dentro da janela de agendamento: de hoje até hoje + 30 dias. */
export function isWithinBookingWindow(date: string, today: string): boolean {
  const diff = daysBetween(today, date);
  return diff >= 0 && diff <= MAX_DAYS_AHEAD;
}

/** O cliente ainda pode cancelar/remarcar? (faltam 2 horas ou mais) */
export function canClientChange(startAt: Date, now: Date = new Date()): boolean {
  return startAt.getTime() - now.getTime() >= CHANGE_LIMIT_MIN * 60_000;
}

/* ---------- Formatação em pt-BR ---------- */

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const WEEKDAYS_LONG = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
const MONTHS_SHORT = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function weekdayShort(date: string): string {
  return WEEKDAYS_SHORT[weekday(date)]!;
}

/** "ter, 18 de nov." */
export function formatDateShort(date: string): string {
  const [, m, d] = date.split("-").map(Number) as [number, number, number];
  return `${weekdayShort(date).toLowerCase()}, ${d} de ${MONTHS_SHORT[m - 1]}`;
}

/** "terça-feira, 18 de novembro" */
export function formatDateLong(date: string): string {
  const [, m, d] = date.split("-").map(Number) as [number, number, number];
  return `${WEEKDAYS_LONG[weekday(date)]}, ${d} de ${MONTHS_LONG[m - 1]}`;
}

/** "18/11/2026" */
export function formatDateNumeric(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

/** Rótulo relativo: "Hoje", "Amanhã" ou a data curta. */
export function relativeDayLabel(date: string, today: string): string {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  return formatDateShort(date);
}
