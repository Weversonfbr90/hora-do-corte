"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { bookingSchema, dateSchema, idSchema, phoneBookingSchema } from "@/lib/validation";
import { bookAppointment, cancelAppointment, getAvailability, rescheduleAppointment, setAttendance } from "../booking";
import { getAppointment } from "../data";
import { authorize } from "../session";
import { run, UserError } from "./run";

const availabilitySchema = z.object({
  barberId: idSchema,
  serviceId: idSchema,
  date: dateSchema,
  ignoreAppointmentId: idSchema.optional(),
});

/** US-08 — Horários livres (minutos desde a meia-noite). */
export async function buscarHorarios(input: z.input<typeof availabilitySchema>) {
  return run(async () => {
    const session = await authorize();
    const params = availabilitySchema.parse(input);
    if (params.ignoreAppointmentId) {
      // Só ignora o próprio agendamento (remarcação).
      const appt = await getAppointment(params.ignoreAppointmentId);
      if (!appt || (appt.clientId !== session.uid && session.role !== "dono")) {
        throw new UserError("Agendamento não encontrado.");
      }
    }
    return getAvailability(params);
  });
}

/** US-09 — O cliente confirma o horário. */
export async function agendar(input: z.input<typeof bookingSchema>) {
  return run(async () => {
    const session = await authorize();
    const data = bookingSchema.parse(input);
    const appt = await bookAppointment({
      ...data,
      client: { id: session.uid, name: session.name, phone: session.phone },
      source: "app",
      createdBy: session.uid,
    });
    revalidatePath("/meus-agendamentos");
    return appt;
  });
}

/** US-18 — O dono agenda para quem ligou. */
export async function agendarPorTelefone(input: z.input<typeof phoneBookingSchema>) {
  return run(async () => {
    const session = await authorize((s) => s.role === "dono");
    const data = phoneBookingSchema.parse(input);
    const appt = await bookAppointment({
      serviceId: data.serviceId,
      barberId: data.barberId,
      date: data.date,
      startMin: data.startMin,
      client: { id: null, name: data.clientName, phone: data.clientPhone },
      source: "telefone",
      createdBy: session.uid,
    });
    revalidatePath("/painel");
    return appt;
  });
}

/** US-12 / US-19 — Cancelar (cliente até 2h antes; dono a qualquer momento). */
export async function cancelar(id: string) {
  return run(async () => {
    const session = await authorize();
    await cancelAppointment(idSchema.parse(id), { uid: session.uid, role: session.role });
    revalidatePath("/meus-agendamentos");
    revalidatePath("/painel");
    revalidatePath("/agenda");
    return undefined;
  });
}

const rescheduleSchema = z.object({ barberId: idSchema, date: dateSchema, startMin: z.number().int().min(0).max(1439) });

/** US-13 — Remarcar. */
export async function remarcar(id: string, target: z.input<typeof rescheduleSchema>) {
  return run(async () => {
    const session = await authorize();
    const appt = await rescheduleAppointment(idSchema.parse(id), rescheduleSchema.parse(target), {
      uid: session.uid,
      role: session.role,
    });
    revalidatePath("/meus-agendamentos");
    return appt;
  });
}

/** US-15 / US-19 — Concluído, falta ou desfazer. */
export async function marcarPresenca(id: string, status: "concluido" | "falta" | "agendado") {
  return run(async () => {
    const session = await authorize((s) => s.isBarber || s.role === "dono");
    const st = z.enum(["concluido", "falta", "agendado"]).parse(status);
    await setAttendance(idSchema.parse(id), st, { uid: session.uid, role: session.role });
    revalidatePath("/agenda");
    revalidatePath("/painel");
    return undefined;
  });
}
