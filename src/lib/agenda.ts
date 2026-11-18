/**
 * Regras de agenda (funções puras, testadas em tests/unit).
 */
import type { Barber, DaySchedule, Interval } from "./types";
import { addDays, isWithinBookingWindow, MAX_DAYS_AHEAD, weekday } from "./time";

/** Expediente efetivo do barbeiro numa data (null = não trabalha). */
export function scheduleForDate(barber: Pick<Barber, "schedule" | "daysOff">, date: string): DaySchedule | null {
  if (barber.daysOff.includes(date)) return null;
  const day = barber.schedule[weekday(date)];
  if (!day || !day.works || day.end <= day.start) return null;
  return day;
}

/** Períodos de trabalho do dia, já descontando o intervalo (almoço). */
export function workingPeriods(day: DaySchedule): Interval[] {
  const { start, end, breakStart, breakEnd } = day;
  if (breakStart != null && breakEnd != null && breakStart < breakEnd && breakStart > start && breakEnd < end) {
    return [
      { start, end: breakStart },
      { start: breakEnd, end },
    ];
  }
  return [{ start, end }];
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export interface AvailabilityInput {
  barber: Pick<Barber, "schedule" | "daysOff">;
  date: string;
  durationMin: number;
  stepMin: number;
  busy: Interval[];
  /** "Agora" no fuso da barbearia. */
  now: { date: string; minutes: number };
}

/**
 * Horários de início livres para um serviço:
 * - dentro do expediente (sem atravessar o intervalo) e cabendo a duração inteira;
 * - sem sobrepor outro atendimento;
 * - no futuro e dentro da janela de 30 dias.
 */
export function availableStarts({ barber, date, durationMin, stepMin, busy, now }: AvailabilityInput): number[] {
  if (!isWithinBookingWindow(date, now.date)) return [];
  const day = scheduleForDate(barber, date);
  if (!day || durationMin <= 0 || stepMin <= 0) return [];

  const result: number[] = [];
  for (const period of workingPeriods(day)) {
    // Os inícios seguem a grade a partir do começo de cada período (manhã / depois do intervalo).
    for (let start = period.start; start + durationMin <= period.end; start += stepMin) {
      if (date === now.date && start <= now.minutes) continue;
      const slot = { start, end: start + durationMin };
      if (busy.some((b) => overlaps(slot, b))) continue;
      result.push(start);
    }
  }
  return result;
}

/** Datas da janela de agendamento (hoje … hoje + 30), marcando as que o barbeiro trabalha. */
export function bookingDays(barber: Pick<Barber, "schedule" | "daysOff">, today: string): { date: string; works: boolean }[] {
  return Array.from({ length: MAX_DAYS_AHEAD + 1 }, (_, i) => {
    const date = addDays(today, i);
    return { date, works: scheduleForDate(barber, date) !== null };
  });
}

/** Valida um expediente semanal. Retorna mensagem de erro ou null. */
export function validateDaySchedule(day: DaySchedule): string | null {
  if (!day.works) return null;
  if (!(day.start < day.end)) return "O início precisa ser antes do fim.";
  const hasBreakStart = day.breakStart != null;
  const hasBreakEnd = day.breakEnd != null;
  if (hasBreakStart !== hasBreakEnd) return "Preencha início e fim do intervalo, ou deixe os dois vazios.";
  if (hasBreakStart && hasBreakEnd) {
    if (!(day.breakStart! < day.breakEnd!)) return "O intervalo precisa começar antes de terminar.";
    if (!(day.breakStart! > day.start && day.breakEnd! < day.end)) return "O intervalo precisa ficar dentro do expediente.";
  }
  return null;
}
