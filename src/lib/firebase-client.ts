"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, inMemoryPersistence, setPersistence, type Auth } from "firebase/auth";

/**
 * Firebase no navegador: usado SÓ para autenticação (entrar e recuperar senha).
 * Os dados nunca são lidos daqui: o Firestore nega acesso direto e tudo passa pelo servidor.
 */
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || (useEmulators ? "demo-api-key" : ""),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-hora-do-corte",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
};

let auth: Auth | null = null;

export function clientAuth(): Auth {
  if (auth) return auth;
  const app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  auth.languageCode = "pt-BR";
  if (useEmulators) {
    connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9099"}`, {
      disableWarnings: true,
    });
  }
  // A sessão de verdade é o cookie httpOnly emitido pelo servidor; não guardamos tokens no navegador.
  void setPersistence(auth, inMemoryPersistence);
  return auth;
}
