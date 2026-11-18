import { NextResponse, type NextRequest } from "next/server";
import { adminAuth, db } from "@/server/firebase-admin";
import { homePath, SESSION_COOKIE, SESSION_DAYS } from "@/server/session";

/** Aceita só requisições vindas do próprio site (proteção contra CSRF). */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

/** US-02 — Troca o ID token do Firebase por um cookie de sessão httpOnly. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });

  let idToken: unknown;
  try {
    ({ idToken } = await req.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true);
    // Só aceita login recente (evita reutilizar tokens antigos).
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ error: "Entre de novo." }, { status: 401 });
    }

    const userRef = db().collection("users").doc(decoded.uid);
    let snap = await userRef.get();
    if (!snap.exists) {
      // Conta criada fora do app (ex.: console): vira cliente.
      const authUser = await adminAuth().getUser(decoded.uid);
      await userRef.set({
        name: authUser.displayName || authUser.email?.split("@")[0] || "Cliente",
        phone: authUser.phoneNumber || "",
        email: authUser.email || "",
        role: "cliente",
        status: "ativo",
        createdAt: new Date(),
      });
      snap = await userRef.get();
    }
    const user = snap.data()!;
    if (user.status === "suspenso") {
      return NextResponse.json({ error: "Seu acesso está suspenso. Fale com a barbearia." }, { status: 403 });
    }

    const expiresIn = SESSION_DAYS * 24 * 60 * 60 * 1000;
    const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
    const res = NextResponse.json({ redirectTo: homePath({ role: user.role }) });
    res.cookies.set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn / 1000,
    });
    return res;
  } catch (err) {
    console.error("[sessao] falha ao criar sessão:", (err as Error).message);
    return NextResponse.json({ error: "Não foi possível entrar. Tente de novo." }, { status: 401 });
  }
}

/** US-04 — Sair: apaga o cookie de sessão deste aparelho. */
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
