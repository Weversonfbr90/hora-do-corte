/**
 * Testes de integração contra os emuladores do Firebase (Firestore real, local).
 * Rodar: npm run test:integracao   (sobe e derruba os emuladores sozinho)
 */
import { Timestamp } from "firebase-admin/firestore";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { addDays, toInstant, zonedNow } from "@/lib/time";
import type { DaySchedule } from "@/lib/types";
import {
  BookingError,
  bookAppointment,
  cancelAppointment,
  getAvailability,
  rescheduleAppointment,
  setAttendance,
} from "@/server/booking";
import { db } from "@/server/firebase-admin";

const PROJECT = "demo-hora-do-corte";
const host = process.env.FIRESTORE_EMULATOR_HOST;

const allDay: DaySchedule = { works: true, start: 6 * 60, end: 23 * 60, breakStart: null, breakEnd: null };
const TOMORROW = addDays(zonedNow().date, 1);

async function clearFirestore() {
  await fetch(`http://${host}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: "DELETE" });
}

const client = (id: string) => ({ id, name: `Cliente ${id}`, phone: "11912345678" });
const book = (startMin: number, clientId = "c1", barberId = "b1", date = TOMORROW) =>
  bookAppointment({ serviceId: "corte", barberId, date, startMin, client: client(clientId), source: "app", createdBy: clientId });

beforeAll(() => {
  if (!host) throw new Error("Rode com os emuladores: npm run test:integracao");
});

beforeEach(async () => {
  await clearFirestore();
  const week = [allDay, allDay, allDay, allDay, allDay, allDay, allDay];
  await Promise.all([
    db().collection("services").doc("corte").set({ name: "Corte", durationMin: 30, priceCents: 4000, active: true }),
    db().collection("services").doc("longo").set({ name: "Corte + barba", durationMin: 60, priceCents: 6500, active: true }),
    db().collection("barbers").doc("b1").set({ name: "Barbeiro Um", active: true, schedule: week, daysOff: [] }),
    db().collection("barbers").doc("b2").set({ name: "Barbeiro Dois", active: true, schedule: week, daysOff: [] }),
    db().collection("settings").doc("barbearia").set({ name: "Teste", address: "", phone: "", slotStepMin: 30 }),
  ]);
});

describe("criar agendamento", () => {
  it("grava o agendamento com dados copiados e ocupa o horário", async () => {
    const appt = await book(10 * 60);
    expect(appt).toMatchObject({ status: "agendado", serviceName: "Corte", barberName: "Barbeiro Um", priceCents: 4000, startMin: 600, endMin: 630 });
    expect(appt.startAt).toBe(toInstant(TOMORROW, 600).toISOString());
    const free = await getAvailability({ barberId: "b1", serviceId: "corte", date: TOMORROW });
    expect(free).not.toContain(600);
    expect(free).toContain(630);
  });

  it("dois clientes no MESMO horário AO MESMO TEMPO: só o primeiro é confirmado", async () => {
    const results = await Promise.allSettled([book(9 * 60, "c1"), book(9 * 60, "c2"), book(9 * 60, "c3"), book(9 * 60, "c4"), book(9 * 60, "c5")]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const fail = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(fail).toHaveLength(4);
    for (const f of fail) {
      expect(f.reason).toBeInstanceOf(BookingError);
      expect((f.reason as BookingError).code).toBe("conflito");
    }
    const snap = await db().collection("appointments").where("barberId", "==", "b1").get();
    expect(snap.size).toBe(1);
  });

  it("horários sobrepostos também são barrados (serviço longo)", async () => {
    await bookAppointment({ serviceId: "longo", barberId: "b1", date: TOMORROW, startMin: 600, client: client("c1"), source: "app", createdBy: "c1" });
    await expect(book(630, "c2")).rejects.toMatchObject({ code: "conflito" }); // 10:30 cai dentro de 10:00–11:00
    await expect(book(660, "c2")).resolves.toMatchObject({ startMin: 660 });
  });

  it("barbeiros diferentes no mesmo horário: os dois confirmam", async () => {
    const [a, b] = await Promise.all([book(600, "c1", "b1"), book(600, "c2", "b2")]);
    expect(a.barberId).toBe("b1");
    expect(b.barberId).toBe("b2");
  });

  it("recusa fora do expediente, além de 30 dias e barbeiro inativo", async () => {
    await expect(book(5 * 60)).rejects.toBeInstanceOf(BookingError);
    await expect(book(600, "c1", "b1", addDays(zonedNow().date, 31))).rejects.toThrow(/30 dias/);
    await db().collection("barbers").doc("b2").update({ active: false });
    await expect(book(600, "c1", "b2")).rejects.toThrow(/não está atendendo/);
  });
});

describe("cancelar e remarcar", () => {
  it("cliente cancela e o horário volta a ficar livre", async () => {
    const appt = await book(600, "c1");
    await cancelAppointment(appt.id, { uid: "c1", role: "cliente" });
    expect((await db().collection("appointments").doc(appt.id).get()).data()!.status).toBe("cancelado");
    expect(await getAvailability({ barberId: "b1", serviceId: "corte", date: TOMORROW })).toContain(600);
  });

  it("outro cliente não consegue cancelar", async () => {
    const appt = await book(600, "c1");
    await expect(cancelAppointment(appt.id, { uid: "intruso", role: "cliente" })).rejects.toMatchObject({ code: "nao-encontrado" });
  });

  it("cliente não muda com menos de 2 horas; o dono pode", async () => {
    const ref = db().collection("appointments").doc("perto");
    await ref.set({
      clientId: "c1", clientName: "C", clientPhone: "", barberId: "b1", barberName: "B", serviceId: "corte", serviceName: "Corte",
      durationMin: 30, priceCents: 4000, date: zonedNow().date, startMin: 0, endMin: 30,
      startAt: Timestamp.fromMillis(Date.now() + 60 * 60_000), status: "agendado", source: "app",
    });
    await expect(cancelAppointment("perto", { uid: "c1", role: "cliente" })).rejects.toMatchObject({ code: "prazo" });
    await expect(rescheduleAppointment("perto", { barberId: "b1", date: TOMORROW, startMin: 600 }, { uid: "c1", role: "cliente" })).rejects.toMatchObject({ code: "prazo" });
    await cancelAppointment("perto", { uid: "dono", role: "dono" });
    expect((await ref.get()).data()!.status).toBe("cancelado");
  });

  it("remarcar libera o horário antigo e ocupa o novo", async () => {
    const appt = await book(600, "c1");
    const moved = await rescheduleAppointment(appt.id, { barberId: "b2", date: TOMORROW, startMin: 720 }, { uid: "c1", role: "cliente" });
    expect(moved).toMatchObject({ barberId: "b2", startMin: 720, status: "agendado" });
    expect(await getAvailability({ barberId: "b1", serviceId: "corte", date: TOMORROW })).toContain(600);
    expect(await getAvailability({ barberId: "b2", serviceId: "corte", date: TOMORROW })).not.toContain(720);
  });

  it("remarcar para horário ocupado falha SEM perder o horário atual", async () => {
    const mine = await book(600, "c1");
    await book(700 - 40, "c2"); // 11:00
    await expect(rescheduleAppointment(mine.id, { barberId: "b1", date: TOMORROW, startMin: 660 }, { uid: "c1", role: "cliente" })).rejects.toMatchObject({ code: "conflito" });
    const still = (await db().collection("appointments").doc(mine.id).get()).data()!;
    expect(still).toMatchObject({ status: "agendado", startMin: 600 });
    expect(await getAvailability({ barberId: "b1", serviceId: "corte", date: TOMORROW })).not.toContain(600);
  });

  it("remarcar no mesmo dia para um horário vizinho (sobrepondo o próprio) funciona", async () => {
    const mine = await bookAppointment({ serviceId: "longo", barberId: "b1", date: TOMORROW, startMin: 600, client: client("c1"), source: "app", createdBy: "c1" });
    const moved = await rescheduleAppointment(mine.id, { barberId: "b1", date: TOMORROW, startMin: 630 }, { uid: "c1", role: "cliente" });
    expect(moved.startMin).toBe(630);
    const free = await getAvailability({ barberId: "b1", serviceId: "corte", date: TOMORROW });
    expect(free).toContain(600);
    expect(free).not.toContain(660);
  });
});

describe("concluído e falta", () => {
  async function pastAppointment() {
    const ref = db().collection("appointments").doc("passado");
    await ref.set({
      clientId: "c1", clientName: "C", clientPhone: "", barberId: "b1", barberName: "B", serviceId: "corte", serviceName: "Corte",
      durationMin: 30, priceCents: 4000, date: zonedNow().date, startMin: 0, endMin: 30,
      startAt: Timestamp.fromMillis(Date.now() - 10 * 60_000), status: "agendado", source: "app",
    });
    return ref;
  }

  it("o barbeiro marca a própria agenda; outro barbeiro não", async () => {
    const ref = await pastAppointment();
    await expect(setAttendance("passado", "concluido", { uid: "b2", role: "barbeiro" })).rejects.toMatchObject({ code: "nao-encontrado" });
    await setAttendance("passado", "falta", { uid: "b1", role: "barbeiro" });
    expect((await ref.get()).data()!.status).toBe("falta");
    await setAttendance("passado", "agendado", { uid: "b1", role: "barbeiro" }); // desfazer
    expect((await ref.get()).data()!.status).toBe("agendado");
  });

  it("não deixa marcar antes do horário", async () => {
    const appt = await book(600, "c1");
    await expect(setAttendance(appt.id, "concluido", { uid: "b1", role: "barbeiro" })).rejects.toMatchObject({ code: "prazo" });
  });
});
