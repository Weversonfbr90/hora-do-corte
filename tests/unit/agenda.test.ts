import { describe, expect, it } from "vitest";
import { availableStarts, bookingDays, scheduleForDate, validateDaySchedule, workingPeriods } from "@/lib/agenda";
import { defaultSchedule, type DaySchedule, type WeekSchedule } from "@/lib/types";

const day = (p: Partial<DaySchedule> = {}): DaySchedule => ({ works: true, start: 540, end: 1080, breakStart: 720, breakEnd: 780, ...p });
const week = (d: DaySchedule): WeekSchedule => [d, d, d, d, d, d, d];
const barber = { schedule: week(day()), daysOff: [] as string[] };

// 2026-11-18 é uma quarta-feira.
const DATE = "2026-11-18";
const beforeDay = { date: "2026-11-17", minutes: 600 };

describe("expediente", () => {
  it("separa manhã e tarde pelo intervalo", () => {
    expect(workingPeriods(day())).toEqual([
      { start: 540, end: 720 },
      { start: 780, end: 1080 },
    ]);
  });

  it("ignora intervalo fora do expediente", () => {
    expect(workingPeriods(day({ breakStart: 500, breakEnd: 560 }))).toEqual([{ start: 540, end: 1080 }]);
  });

  it("folga e dia sem trabalho não têm expediente", () => {
    expect(scheduleForDate({ ...barber, daysOff: [DATE] }, DATE)).toBeNull();
    const s = defaultSchedule(); // domingo e segunda de folga
    expect(scheduleForDate({ schedule: s, daysOff: [] }, "2026-11-22")).toBeNull(); // domingo
    expect(scheduleForDate({ schedule: s, daysOff: [] }, "2026-11-23")).toBeNull(); // segunda
    expect(scheduleForDate({ schedule: s, daysOff: [] }, "2026-11-24")).not.toBeNull(); // terça
  });
});

describe("horários livres", () => {
  const base = { barber, date: DATE, stepMin: 30, busy: [], now: beforeDay };

  it("oferece só horários em que o serviço inteiro cabe antes do intervalo e do fim", () => {
    const starts = availableStarts({ ...base, durationMin: 50 });
    // Manhã 9:00–12:00: 50 min cabe até 11:00 (11:00+50=11:50); 11:30+50 passaria do almoço.
    expect(starts).toContain(660);
    expect(starts).not.toContain(690);
    // Tarde 13:00–18:00: último início 17:00 (17:00+50=17:50).
    expect(starts.at(-1)).toBe(1020);
    expect(starts).not.toContain(720); // nunca durante o almoço
  });

  it("remove horários que sobrepõem atendimentos existentes", () => {
    const starts = availableStarts({ ...base, durationMin: 30, busy: [{ start: 600, end: 650 }] });
    expect(starts).not.toContain(600);
    expect(starts).not.toContain(630); // 10:30 colide com 10:00–10:50
    expect(starts).toContain(570); // 9:30–10:00 encosta mas não sobrepõe
    expect(starts).toContain(660);
  });

  it("não oferece horários que já passaram hoje", () => {
    const starts = availableStarts({ ...base, durationMin: 30, now: { date: DATE, minutes: 615 } });
    expect(starts[0]).toBe(630);
  });

  it("aceita exatamente 30 dias à frente", () => {
    // 19/10 → 18/11 = 30 dias
    expect(availableStarts({ ...base, durationMin: 30, now: { date: "2026-10-19", minutes: 0 } })).not.toHaveLength(0);
  });

  it("recusa datas além de 30 dias e no passado", () => {
    expect(availableStarts({ ...base, durationMin: 30, now: { date: "2026-10-17", minutes: 0 } })).toEqual([]);
    expect(availableStarts({ ...base, durationMin: 30, now: { date: "2026-11-19", minutes: 0 } })).toEqual([]);
  });

  it("dia de folga não tem horários", () => {
    expect(availableStarts({ ...base, barber: { ...barber, daysOff: [DATE] }, durationMin: 30 })).toEqual([]);
  });

  it("segue o intervalo da grade configurado", () => {
    const starts = availableStarts({ ...base, durationMin: 15, stepMin: 15, barber: { schedule: week(day({ breakStart: null, breakEnd: null, end: 600 })), daysOff: [] } });
    expect(starts).toEqual([540, 555, 570, 585]);
  });
});

describe("dias da janela de agendamento", () => {
  it("lista hoje + 30 dias e marca quais o barbeiro trabalha", () => {
    const days = bookingDays({ schedule: defaultSchedule(), daysOff: ["2026-11-25"] }, "2026-11-17");
    expect(days).toHaveLength(31);
    expect(days[0]).toEqual({ date: "2026-11-17", works: true }); // terça
    expect(days.find((d) => d.date === "2026-11-22")?.works).toBe(false); // domingo
    expect(days.find((d) => d.date === "2026-11-25")?.works).toBe(false); // folga
    expect(days.at(-1)?.date).toBe("2026-12-17");
  });
});

describe("validação do expediente", () => {
  it("aceita dia válido e dia de folga", () => {
    expect(validateDaySchedule(day())).toBeNull();
    expect(validateDaySchedule(day({ works: false, start: 900, end: 100 }))).toBeNull();
  });
  it("recusa início depois do fim e intervalo fora do expediente", () => {
    expect(validateDaySchedule(day({ start: 1100 }))).toMatch(/início/);
    expect(validateDaySchedule(day({ breakStart: 500 }))).toMatch(/dentro/);
    expect(validateDaySchedule(day({ breakEnd: null }))).toMatch(/intervalo/);
  });
});
