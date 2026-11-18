import "server-only";
import { FieldValue, Timestamp, type DocumentReference } from "firebase-admin/firestore";
import { availableStarts } from "@/lib/agenda";
import { canClientChange, isWithinBookingWindow, toInstant, zonedNow } from "@/lib/time";
import type { Appointment, AppointmentStatus, Interval } from "@/lib/types";
import { busyFrom, refs, settingsFrom, toAppointment, toBarber, toService } from "./data";
import { db } from "./firebase-admin";

/** Erro de regra de negócio com mensagem pronta para o usuário. */
export class BookingError extends Error {
  constructor(
    message: string,
    readonly code: "conflito" | "indisponivel" | "prazo" | "permissao" | "nao-encontrado" | "invalido" = "invalido",
  ) {
    super(message);
  }
}

export const MSG_CONFLITO = "Esse horário acabou de ser ocupado. Escolha outro horário.";

export interface Actor {
  uid: string;
  role: "cliente" | "barbeiro" | "dono";
}

/* ------------------------------------------------------------------ */
/* Horários livres                                                     */
/* ------------------------------------------------------------------ */

export async function getAvailability(params: {
  barberId: string;
  serviceId: string;
  date: string;
  /** Ao remarcar, o horário atual do próprio agendamento conta como livre. */
  ignoreAppointmentId?: string;
}): Promise<number[]> {
  const [barberSnap, serviceSnap, daySnap, settingsSnap] = await db().getAll(
    refs.barber(params.barberId),
    refs.service(params.serviceId),
    refs.barberDay(params.barberId, params.date),
    refs.settings(),
  );
  if (!barberSnap!.exists || !serviceSnap!.exists) return [];
  const barber = toBarber(barberSnap!);
  const service = toService(serviceSnap!);
  if (!barber.active) return [];
  const busy = busyWithout(daySnap!, params.ignoreAppointmentId);
  return availableStarts({
    barber,
    date: params.date,
    durationMin: service.durationMin,
    stepMin: settingsFrom(settingsSnap!).slotStepMin,
    busy,
    now: zonedNow(),
  });
}

function busyWithout(daySnap: FirebaseFirestore.DocumentSnapshot, id?: string): Interval[] {
  if (!id || !daySnap.exists) return busyFrom(daySnap);
  const busy = { ...(daySnap.data()!.busy ?? {}) } as Record<string, Interval>;
  delete busy[id];
  return Object.values(busy);
}

/* ------------------------------------------------------------------ */
/* Criar agendamento                                                   */
/* ------------------------------------------------------------------ */

export interface BookInput {
  serviceId: string;
  barberId: string;
  date: string;
  startMin: number;
  client: { id: string | null; name: string; phone: string };
  source: "app" | "telefone";
  createdBy: string;
}

/**
 * Cria o agendamento numa transação. O documento barberDays/{barbeiro}_{data} guarda os
 * intervalos ocupados; como toda transação do mesmo barbeiro/dia lê e grava esse documento,
 * duas confirmações simultâneas nunca passam juntas: a segunda é refeita, vê o horário
 * ocupado e é recusada.
 */
export async function bookAppointment(input: BookInput): Promise<Appointment> {
  const now = zonedNow();
  if (!isWithinBookingWindow(input.date, now.date)) {
    throw new BookingError("Só é possível agendar de hoje até 30 dias à frente.", "indisponivel");
  }

  const apptRef = db().collection("appointments").doc();
  const dayRef = refs.barberDay(input.barberId, input.date);

  await db().runTransaction(async (tx) => {
    const [serviceSnap, barberSnap, daySnap, settingsSnap] = await tx.getAll(
      refs.service(input.serviceId),
      refs.barber(input.barberId),
      dayRef,
      refs.settings(),
    );
    if (!serviceSnap!.exists || serviceSnap!.data()!.active === false) {
      throw new BookingError("Esse serviço não está mais disponível.", "indisponivel");
    }
    if (!barberSnap!.exists || barberSnap!.data()!.active !== true) {
      throw new BookingError("Esse barbeiro não está atendendo pelo app no momento.", "indisponivel");
    }
    const service = toService(serviceSnap!);
    const barber = toBarber(barberSnap!);
    const starts = availableStarts({
      barber,
      date: input.date,
      durationMin: service.durationMin,
      stepMin: settingsFrom(settingsSnap!).slotStepMin,
      busy: busyFrom(daySnap!),
      now: zonedNow(),
    });
    if (!starts.includes(input.startMin)) throw new BookingError(MSG_CONFLITO, "conflito");

    const endMin = input.startMin + service.durationMin;
    tx.create(apptRef, {
      clientId: input.client.id,
      clientName: input.client.name,
      clientPhone: input.client.phone,
      barberId: barber.id,
      barberName: barber.name,
      serviceId: service.id,
      serviceName: service.name,
      durationMin: service.durationMin,
      priceCents: service.priceCents,
      date: input.date,
      startMin: input.startMin,
      endMin,
      startAt: Timestamp.fromDate(toInstant(input.date, input.startMin)),
      status: "agendado",
      source: input.source,
      createdBy: input.createdBy,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(
      dayRef,
      { barberId: barber.id, date: input.date, busy: { [apptRef.id]: { start: input.startMin, end: endMin } } },
      { merge: true },
    );
  });

  return toAppointment(await apptRef.get());
}

/* ------------------------------------------------------------------ */
/* Cancelar                                                            */
/* ------------------------------------------------------------------ */

function assertCanManageAsClientOrOwner(appt: FirebaseFirestore.DocumentData, actor: Actor) {
  const isOwner = actor.role === "dono";
  const isClient = appt.clientId === actor.uid;
  if (!isOwner && !isClient) throw new BookingError("Agendamento não encontrado.", "nao-encontrado");
  if (appt.status !== "agendado") throw new BookingError("Esse agendamento não pode mais ser alterado.", "invalido");
  // O dono pode mudar a qualquer momento; o cliente só até 2 horas antes.
  if (!isOwner && !canClientChange((appt.startAt as Timestamp).toDate())) {
    throw new BookingError(
      "Só é possível cancelar ou remarcar até 2 horas antes do horário. Fale com a barbearia.",
      "prazo",
    );
  }
}

export async function cancelAppointment(id: string, actor: Actor): Promise<void> {
  const ref = refs.appointment(id);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new BookingError("Agendamento não encontrado.", "nao-encontrado");
    const appt = snap.data()!;
    assertCanManageAsClientOrOwner(appt, actor);
    tx.update(ref, {
      status: "cancelado",
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: actor.uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(refs.barberDay(appt.barberId, appt.date), { busy: { [id]: FieldValue.delete() } }, { merge: true });
  });
}

/* ------------------------------------------------------------------ */
/* Remarcar (atômico: o horário antigo só é liberado se o novo couber) */
/* ------------------------------------------------------------------ */

export async function rescheduleAppointment(
  id: string,
  target: { barberId: string; date: string; startMin: number },
  actor: Actor,
): Promise<Appointment> {
  const now = zonedNow();
  if (!isWithinBookingWindow(target.date, now.date)) {
    throw new BookingError("Só é possível agendar de hoje até 30 dias à frente.", "indisponivel");
  }
  const ref = refs.appointment(id);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new BookingError("Agendamento não encontrado.", "nao-encontrado");
    const appt = snap.data()!;
    assertCanManageAsClientOrOwner(appt, actor);

    const oldDayRef = refs.barberDay(appt.barberId, appt.date);
    const newDayRef = refs.barberDay(target.barberId, target.date);
    const sameDay = oldDayRef.path === newDayRef.path;
    const toRead: DocumentReference[] = [refs.barber(target.barberId), refs.settings(), newDayRef];
    if (!sameDay) toRead.push(oldDayRef);
    const [barberSnap, settingsSnap, newDaySnap] = await tx.getAll(...toRead);

    if (!barberSnap!.exists || barberSnap!.data()!.active !== true) {
      throw new BookingError("Esse barbeiro não está atendendo pelo app no momento.", "indisponivel");
    }
    const barber = toBarber(barberSnap!);
    const starts = availableStarts({
      barber,
      date: target.date,
      durationMin: appt.durationMin,
      stepMin: settingsFrom(settingsSnap!).slotStepMin,
      busy: busyWithout(newDaySnap!, id),
      now: zonedNow(),
    });
    if (!starts.includes(target.startMin)) throw new BookingError(MSG_CONFLITO, "conflito");

    const endMin = target.startMin + appt.durationMin;
    tx.update(ref, {
      barberId: barber.id,
      barberName: barber.name,
      date: target.date,
      startMin: target.startMin,
      endMin,
      startAt: Timestamp.fromDate(toInstant(target.date, target.startMin)),
      rescheduledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    if (sameDay) {
      tx.set(newDayRef, { busy: { [id]: { start: target.startMin, end: endMin } } }, { merge: true });
    } else {
      tx.set(oldDayRef, { busy: { [id]: FieldValue.delete() } }, { merge: true });
      tx.set(
        newDayRef,
        { barberId: barber.id, date: target.date, busy: { [id]: { start: target.startMin, end: endMin } } },
        { merge: true },
      );
    }
  });

  return toAppointment(await ref.get());
}

/* ------------------------------------------------------------------ */
/* Concluído / falta                                                   */
/* ------------------------------------------------------------------ */

export async function setAttendance(id: string, status: Extract<AppointmentStatus, "concluido" | "falta" | "agendado">, actor: Actor) {
  const ref = refs.appointment(id);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new BookingError("Agendamento não encontrado.", "nao-encontrado");
    const appt = snap.data()!;
    // Barbeiro: só a própria agenda. Dono: qualquer agenda.
    if (actor.role !== "dono" && appt.barberId !== actor.uid) {
      throw new BookingError("Agendamento não encontrado.", "nao-encontrado");
    }
    if (appt.status === "cancelado") throw new BookingError("Esse agendamento foi cancelado.", "invalido");
    if (status !== "agendado" && (appt.startAt as Timestamp).toMillis() > Date.now()) {
      throw new BookingError("Só dá para marcar concluído ou falta a partir do horário do atendimento.", "prazo");
    }
    tx.update(ref, { status, attendanceBy: actor.uid, updatedAt: FieldValue.serverTimestamp() });
  });
}
