// DADOS FICTÍCIOS DE TESTE — só para o emulador local.
// Uso: npm run seed   (com `npm run emulators` rodando)
// Cria: dono, 2 barbeiros, 1 cliente, serviços, dados da barbearia e alguns agendamentos de hoje.
// As senhas abaixo são apenas para o emulador local; nunca existem em produção.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error("Recusado: o seed só roda contra os emuladores (defina FIRESTORE_EMULATOR_HOST e FIREBASE_AUTH_EMULATOR_HOST).");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || "demo-hora-do-corte";
initializeApp({ projectId });
const auth = getAuth();
const db = getFirestore();

export const SENHA_TESTE = "senha-teste-123";

const people = [
  { key: "dono", name: "Dono Teste", email: "dono@exemplo.test", phone: "11900000001", role: "dono", barber: true },
  { key: "carlos", name: "Carlos Teste", email: "carlos@exemplo.test", phone: "11900000002", role: "barbeiro", barber: true },
  { key: "junior", name: "Júnior Teste", email: "junior@exemplo.test", phone: "11900000003", role: "barbeiro", barber: true },
  { key: "cliente", name: "Cliente Teste", email: "cliente@exemplo.test", phone: "11900000004", role: "cliente", barber: false },
];

const workday = { works: true, start: 9 * 60, end: 19 * 60, breakStart: 12 * 60, breakEnd: 13 * 60 };
const allWeek = [0, 1, 2, 3, 4, 5, 6].map((d) => (d === 0 ? { ...workday, works: false } : { ...workday }));

const uids = {};
for (const p of people) {
  let user;
  try {
    user = await auth.getUserByEmail(p.email);
  } catch {
    user = await auth.createUser({ email: p.email, password: SENHA_TESTE, displayName: p.name });
  }
  uids[p.key] = user.uid;
  await db.collection("users").doc(user.uid).set({
    name: p.name,
    email: p.email,
    phone: p.phone,
    role: p.role,
    status: "ativo",
    createdAt: FieldValue.serverTimestamp(),
  });
  if (p.barber) {
    await db.collection("barbers").doc(user.uid).set({ name: p.name, active: true, schedule: allWeek, daysOff: [], updatedAt: FieldValue.serverTimestamp() });
  }
}

await db.collection("settings").doc("barbearia").set({
  name: "Barbearia Teste",
  address: "Rua de Teste, 100 — Centro",
  phone: "11900000000",
  slotStepMin: 30,
  ownerId: uids.dono,
});

const services = [
  { id: "corte", name: "Corte", durationMin: 30, priceCents: 4000 },
  { id: "barba", name: "Barba", durationMin: 20, priceCents: 3000 },
  { id: "corte-barba", name: "Corte + barba", durationMin: 50, priceCents: 6500 },
  { id: "pezinho", name: "Pezinho", durationMin: 10, priceCents: 1500 },
];
for (const s of services) {
  const { id, ...data } = s;
  await db.collection("services").doc(id).set({ ...data, active: true, createdAt: FieldValue.serverTimestamp() });
}

// Agendamentos de hoje para o Carlos (fuso America/Sao_Paulo, UTC-3).
const now = new Date();
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
const toDate = (min) => new Date(`${today}T${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}:00-03:00`);
const sample = [
  { start: 9 * 60, service: services[0], client: "Cliente Teste", clientId: uids.cliente, status: "concluido" },
  { start: 10 * 60, service: services[2], client: "Visitante por Telefone", clientId: null, status: "agendado", source: "telefone" },
  { start: 17 * 60, service: services[1], client: "Cliente Teste", clientId: uids.cliente, status: "agendado" },
];
const busy = {};
for (const a of sample) {
  const ref = db.collection("appointments").doc();
  await ref.set({
    clientId: a.clientId,
    clientName: a.client,
    clientPhone: "11900000004",
    barberId: uids.carlos,
    barberName: "Carlos Teste",
    serviceId: a.service.id,
    serviceName: a.service.name,
    durationMin: a.service.durationMin,
    priceCents: a.service.priceCents,
    date: today,
    startMin: a.start,
    endMin: a.start + a.service.durationMin,
    startAt: Timestamp.fromDate(toDate(a.start)),
    status: a.status,
    source: a.source ?? "app",
    createdBy: uids.dono,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  busy[ref.id] = { start: a.start, end: a.start + a.service.durationMin };
}
await db.collection("barberDays").doc(`${uids.carlos}_${today}`).set({ barberId: uids.carlos, date: today, busy });

console.log("Dados de TESTE criados no emulador:");
for (const p of people) console.log(`  ${p.role.padEnd(9)} ${p.email}  (senha: ${SENHA_TESTE})`);
