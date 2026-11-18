import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Firebase Admin SDK (somente no servidor).
 * - Com emuladores (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST definidos) não precisa de credencial.
 * - Em produção usa a conta de serviço das variáveis FIREBASE_*.
 */
function createApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const usingEmulators = Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);

  if (usingEmulators) {
    return initializeApp({ projectId: projectId || "demo-hora-do-corte" });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin não configurado: defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY (veja o README).",
    );
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

let firestore: Firestore | null = null;

export function adminAuth() {
  return getAuth(createApp());
}

export function db(): Firestore {
  if (!firestore) {
    firestore = getFirestore(createApp());
    try {
      firestore.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings() só pode ser chamado uma vez; em recarga a quente já foi aplicado.
    }
  }
  return firestore;
}
