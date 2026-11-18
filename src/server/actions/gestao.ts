"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { validateDaySchedule } from "@/lib/agenda";
import { isWithinBookingWindow, zonedNow, daysBetween } from "@/lib/time";
import { defaultSchedule, type ShopSettings, type WeekSchedule } from "@/lib/types";
import { dateSchema, emailSchema, idSchema, serviceSchema, settingsSchema, weekScheduleSchema } from "@/lib/validation";
import { refs } from "../data";
import { adminAuth, db } from "../firebase-admin";
import { authorize } from "../session";
import { run, UserError } from "./run";

const onlyOwner = () => authorize((s) => s.role === "dono");

/* ------------------------------------------------------------------ */
/* US-20 — Serviços                                                    */
/* ------------------------------------------------------------------ */

export async function salvarServico(id: string | null, input: z.input<typeof serviceSchema>) {
  return run(async () => {
    await onlyOwner();
    const data = serviceSchema.parse(input);
    if (id) {
      const ref = refs.service(idSchema.parse(id));
      if (!(await ref.get()).exists) throw new UserError("Serviço não encontrado.");
      await ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    } else {
      await db().collection("services").add({ ...data, active: true, createdAt: FieldValue.serverTimestamp() });
    }
    revalidatePath("/gestao/servicos");
    revalidatePath("/agendar");
    return undefined;
  });
}

export async function alternarServico(id: string, active: boolean) {
  return run(async () => {
    await onlyOwner();
    await refs.service(idSchema.parse(id)).update({ active: z.boolean().parse(active), updatedAt: FieldValue.serverTimestamp() });
    revalidatePath("/gestao/servicos");
    revalidatePath("/agendar");
    return undefined;
  });
}

/** Excluir (a interface pede confirmação). Agendamentos já feitos guardam nome e preço copiados. */
export async function excluirServico(id: string) {
  return run(async () => {
    await onlyOwner();
    await refs.service(idSchema.parse(id)).delete();
    revalidatePath("/gestao/servicos");
    revalidatePath("/agendar");
    return undefined;
  });
}

/* ------------------------------------------------------------------ */
/* US-21 — Liberar / remover barbeiro                                  */
/* ------------------------------------------------------------------ */

/** Procura UMA conta pelo e-mail exato (não existe listagem de clientes, por privacidade). */
export async function buscarConta(input: { email: string }) {
  return run(async () => {
    await onlyOwner();
    const { email } = emailSchema.parse(input);
    const snap = await db().collection("users").where("email", "==", email).limit(1).get();
    const doc = snap.docs[0];
    if (!doc) throw new UserError("Não encontramos uma conta com esse e-mail. Peça para a pessoa criar a conta no app primeiro.");
    const u = doc.data();
    const barberSnap = await refs.barber(doc.id).get();
    return {
      id: doc.id,
      name: u.name as string,
      email: u.email as string,
      role: u.role as "cliente" | "barbeiro" | "dono",
      status: u.status as "ativo" | "suspenso",
      isBarber: barberSnap.exists && barberSnap.data()!.active === true,
    };
  });
}

export async function liberarBarbeiro(input: { email: string }) {
  return run(async () => {
    const owner = await onlyOwner();
    const { email } = emailSchema.parse(input);
    const snap = await db().collection("users").where("email", "==", email).limit(1).get();
    const userDoc = snap.docs[0];
    if (!userDoc) {
      throw new UserError("Não encontramos uma conta com esse e-mail. Peça para a pessoa criar a conta no app primeiro.");
    }
    const user = userDoc.data();
    if (user.status === "suspenso") throw new UserError("Essa conta está suspensa. Reative o acesso antes de liberar.");
    const barberRef = refs.barber(userDoc.id);
    const barberSnap = await barberRef.get();
    if (barberSnap.exists && barberSnap.data()!.active) throw new UserError("Essa pessoa já está na equipe.");

    const batch = db().batch();
    // O dono continua dono (ele também pode atender). Os demais passam a barbeiro.
    if (userDoc.id !== owner.uid) batch.update(userDoc.ref, { role: "barbeiro" });
    batch.set(
      barberRef,
      {
        name: user.name,
        active: true,
        schedule: barberSnap.exists ? barberSnap.data()!.schedule : defaultSchedule(),
        daysOff: barberSnap.exists ? barberSnap.data()!.daysOff ?? [] : [],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await batch.commit();
    revalidatePath("/gestao/equipe");
    return { id: userDoc.id, name: user.name as string };
  });
}

/** Remove o perfil de barbeiro: a pessoa volta a ser cliente (agendamentos já feitos continuam). */
export async function removerBarbeiro(uid: string) {
  return run(async () => {
    const owner = await onlyOwner();
    const id = idSchema.parse(uid);
    const batch = db().batch();
    batch.set(refs.barber(id), { active: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    if (id !== owner.uid) batch.update(refs.user(id), { role: "cliente" });
    await batch.commit();
    revalidatePath("/gestao/equipe");
    return undefined;
  });
}

/* ------------------------------------------------------------------ */
/* US-22 — Expediente e folgas                                         */
/* ------------------------------------------------------------------ */

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export async function salvarExpediente(barberId: string, schedule: WeekSchedule) {
  return run(async () => {
    await onlyOwner();
    const parsed = weekScheduleSchema.parse(schedule) as WeekSchedule;
    parsed.forEach((day, i) => {
      const err = validateDaySchedule(day);
      if (err) throw new UserError(`${DAY_NAMES[i]}: ${err}`);
    });
    const ref = refs.barber(idSchema.parse(barberId));
    if (!(await ref.get()).exists) throw new UserError("Barbeiro não encontrado.");
    await ref.update({ schedule: parsed, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath(`/gestao/equipe/${barberId}`);
    return undefined;
  });
}

export async function adicionarFolga(barberId: string, date: string) {
  return run(async () => {
    await onlyOwner();
    const d = dateSchema.parse(date);
    const today = zonedNow().date;
    if (daysBetween(today, d) < 0) throw new UserError("Escolha uma data de hoje em diante.");
    if (daysBetween(today, d) > 365) throw new UserError("Escolha uma data dentro do próximo ano.");
    const ref = refs.barber(idSchema.parse(barberId));
    if (!(await ref.get()).exists) throw new UserError("Barbeiro não encontrado.");
    await ref.update({ daysOff: FieldValue.arrayUnion(d), updatedAt: FieldValue.serverTimestamp() });
    revalidatePath(`/gestao/equipe/${barberId}`);
    // Aviso útil: agendamentos já existentes nesse dia não são cancelados automaticamente.
    const existing = await db()
      .collection("appointments")
      .where("barberId", "==", barberId)
      .where("date", "==", d)
      .where("status", "==", "agendado")
      .get();
    return { existing: existing.size, withinWindow: isWithinBookingWindow(d, today) };
  });
}

export async function removerFolga(barberId: string, date: string) {
  return run(async () => {
    await onlyOwner();
    await refs.barber(idSchema.parse(barberId)).update({
      daysOff: FieldValue.arrayRemove(dateSchema.parse(date)),
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath(`/gestao/equipe/${barberId}`);
    return undefined;
  });
}

/* ------------------------------------------------------------------ */
/* US-23 — Suspender / reativar acesso                                 */
/* ------------------------------------------------------------------ */

export async function suspenderAcesso(uid: string) {
  return run(async () => {
    const owner = await onlyOwner();
    const id = idSchema.parse(uid);
    if (id === owner.uid) throw new UserError("Você não pode suspender o próprio acesso.");
    const userRef = refs.user(id);
    if (!(await userRef.get()).exists) throw new UserError("Conta não encontrada.");
    await adminAuth().updateUser(id, { disabled: true });
    await adminAuth().revokeRefreshTokens(id); // derruba as sessões abertas
    const batch = db().batch();
    batch.update(userRef, { status: "suspenso", suspendedAt: FieldValue.serverTimestamp() });
    const barberRef = refs.barber(id);
    if ((await barberRef.get()).exists) batch.update(barberRef, { active: false, suspended: true });
    await batch.commit();
    revalidatePath("/gestao/equipe");
    return undefined;
  });
}

export async function reativarAcesso(uid: string) {
  return run(async () => {
    await onlyOwner();
    const id = idSchema.parse(uid);
    await adminAuth().updateUser(id, { disabled: false });
    const batch = db().batch();
    batch.update(refs.user(id), { status: "ativo", suspendedAt: FieldValue.delete() });
    const barberRef = refs.barber(id);
    const barberSnap = await barberRef.get();
    if (barberSnap.exists && barberSnap.data()!.suspended) batch.update(barberRef, { active: true, suspended: false });
    await batch.commit();
    revalidatePath("/gestao/equipe");
    return undefined;
  });
}

/* ------------------------------------------------------------------ */
/* US-24 — Dados da barbearia                                          */
/* ------------------------------------------------------------------ */

export async function salvarBarbearia(input: ShopSettings) {
  return run(async () => {
    await onlyOwner();
    const data = settingsSchema.parse(input);
    await refs.settings().set({ ...data, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    revalidatePath("/", "layout");
    return undefined;
  });
}
