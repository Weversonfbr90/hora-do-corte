import "server-only";
import type { DocumentSnapshot, Timestamp } from "firebase-admin/firestore";
import type { Appointment, Barber, Interval, Service, ShopSettings, WeekSchedule } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import { db } from "./firebase-admin";

/* ---------- Conversores ---------- */

export function toService(snap: DocumentSnapshot): Service {
  const d = snap.data()!;
  return { id: snap.id, name: d.name, durationMin: d.durationMin, priceCents: d.priceCents, active: d.active !== false };
}

export function toBarber(snap: DocumentSnapshot): Barber {
  const d = snap.data()!;
  return {
    id: snap.id,
    name: d.name,
    active: d.active === true,
    schedule: d.schedule as WeekSchedule,
    daysOff: Array.isArray(d.daysOff) ? d.daysOff : [],
  };
}

export function toAppointment(snap: DocumentSnapshot): Appointment {
  const d = snap.data()!;
  return {
    id: snap.id,
    clientId: d.clientId ?? null,
    clientName: d.clientName,
    clientPhone: d.clientPhone ?? "",
    barberId: d.barberId,
    barberName: d.barberName,
    serviceId: d.serviceId,
    serviceName: d.serviceName,
    durationMin: d.durationMin,
    priceCents: d.priceCents,
    date: d.date,
    startMin: d.startMin,
    endMin: d.endMin,
    startAt: (d.startAt as Timestamp).toDate().toISOString(),
    status: d.status,
    source: d.source ?? "app",
  };
}

export function busyFrom(snap: DocumentSnapshot): Interval[] {
  const busy = (snap.exists ? snap.data()!.busy : null) ?? {};
  return Object.values(busy as Record<string, Interval>);
}

export function settingsFrom(snap: DocumentSnapshot): ShopSettings {
  return { ...DEFAULT_SETTINGS, ...(snap.exists ? (snap.data() as Partial<ShopSettings>) : {}) };
}

/* ---------- Referências ---------- */

export const refs = {
  user: (uid: string) => db().collection("users").doc(uid),
  barber: (uid: string) => db().collection("barbers").doc(uid),
  service: (id: string) => db().collection("services").doc(id),
  appointment: (id: string) => db().collection("appointments").doc(id),
  barberDay: (barberId: string, date: string) => db().collection("barberDays").doc(`${barberId}_${date}`),
  settings: () => db().collection("settings").doc("barbearia"),
};

/* ---------- Leituras ---------- */

export async function getSettings(): Promise<ShopSettings> {
  return settingsFrom(await refs.settings().get());
}

const byName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name, "pt-BR");

export async function listServices({ activeOnly }: { activeOnly: boolean }): Promise<Service[]> {
  const q = activeOnly ? db().collection("services").where("active", "==", true) : db().collection("services");
  const snap = await q.get();
  return snap.docs.map(toService).sort(byName);
}

export async function listBarbers({ activeOnly }: { activeOnly: boolean }): Promise<Barber[]> {
  const q = activeOnly ? db().collection("barbers").where("active", "==", true) : db().collection("barbers");
  const snap = await q.get();
  return snap.docs.map(toBarber).sort(byName);
}

export async function getBarber(id: string): Promise<Barber | null> {
  const snap = await refs.barber(id).get();
  return snap.exists ? toBarber(snap) : null;
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const snap = await refs.appointment(id).get();
  return snap.exists ? toAppointment(snap) : null;
}

const byStart = (a: Appointment, b: Appointment) => a.startAt.localeCompare(b.startAt);

/** Só os agendamentos do próprio cliente. */
export async function listClientAppointments(clientId: string): Promise<Appointment[]> {
  const snap = await db().collection("appointments").where("clientId", "==", clientId).get();
  return snap.docs.map(toAppointment).sort(byStart);
}

/** Agenda de um barbeiro num dia. */
export async function listBarberDay(barberId: string, date: string): Promise<Appointment[]> {
  const snap = await db().collection("appointments").where("barberId", "==", barberId).where("date", "==", date).get();
  return snap.docs.map(toAppointment).sort(byStart);
}

/** Agenda de todos num dia (painel do dono). */
export async function listDay(date: string): Promise<Appointment[]> {
  const snap = await db().collection("appointments").where("date", "==", date).get();
  return snap.docs.map(toAppointment).sort(byStart);
}
