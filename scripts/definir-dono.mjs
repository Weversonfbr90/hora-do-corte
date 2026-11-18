// Configuração inicial (US-05): define qual conta é a do DONO da barbearia.
// Uso:  npm run definir-dono -- email@dono.com
// A pessoa precisa ter criado a conta no app antes.
// Funciona com os emuladores (FIRESTORE_EMULATOR_HOST) ou com o projeto real (FIREBASE_* no .env.local).
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Informe o e-mail da conta do dono:  npm run definir-dono -- email@dono.com");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-hora-do-corte";
const emulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
initializeApp(
  emulators
    ? { projectId }
    : {
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      },
);

const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  console.error(`Não existe conta com o e-mail ${email}. Crie a conta no app (/criar-conta) e rode de novo.`);
  process.exit(1);
}

await db.collection("users").doc(user.uid).set(
  {
    name: user.displayName || email.split("@")[0],
    email,
    phone: "",
    status: "ativo",
    ...(await db.collection("users").doc(user.uid).get()).data(),
    role: "dono",
  },
  { merge: true },
);
await db.collection("settings").doc("barbearia").set({ ownerId: user.uid }, { merge: true });

console.log(`Pronto: ${email} agora é o DONO (${emulators ? "emulador" : `projeto ${projectId}`}).`);
console.log("Saia e entre de novo no app para ver o Painel do dono.");
