import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role, UserProfile } from "@/lib/types";
import { adminAuth, db } from "./firebase-admin";

export const SESSION_COOKIE = "__session";
export const SESSION_DAYS = 5;

export interface Session extends UserProfile {
  /** Tem perfil de barbeiro ativo (barbeiro, ou dono que também atende). */
  isBarber: boolean;
}

/**
 * Lê e valida o cookie de sessão (com checagem de revogação: contas suspensas caem na hora).
 * Memorizado por requisição.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    const [userSnap, barberSnap] = await Promise.all([
      db().collection("users").doc(decoded.uid).get(),
      db().collection("barbers").doc(decoded.uid).get(),
    ]);
    if (!userSnap.exists) return null;
    const u = userSnap.data()!;
    if (u.status === "suspenso") return null;
    return {
      uid: decoded.uid,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      status: u.status,
      isBarber: barberSnap.exists && barberSnap.data()!.active === true,
    };
  } catch {
    return null;
  }
});

/** Tela inicial de cada perfil. */
export function homePath(session: Pick<Session, "role">): string {
  if (session.role === "dono") return "/painel";
  if (session.role === "barbeiro") return "/agenda";
  return "/agendar";
}

/** Para páginas: exige sessão (e perfil). Redireciona quando não atende. */
export async function requireSession(roles?: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/entrar");
  if (roles && !roles.includes(session.role)) redirect(homePath(session));
  return session;
}

/** Para páginas da agenda do barbeiro. */
export async function requireBarber(): Promise<Session> {
  const session = await requireSession();
  if (!session.isBarber) redirect(homePath(session));
  return session;
}

export class AuthError extends Error {}

/** Para Server Actions: lança AuthError (tratado pelo wrapper `action`). */
export async function authorize(check?: (s: Session) => boolean): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthError("Sua sessão terminou. Entre de novo para continuar.");
  if (check && !check(session)) throw new AuthError("Você não tem permissão para fazer isso.");
  return session;
}
