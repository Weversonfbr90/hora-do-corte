import { redirect } from "next/navigation";
import { getSession, homePath } from "@/server/session";

/** Raiz: leva cada pessoa para a tela do seu perfil (ou para Entrar). */
export default async function Home() {
  const session = await getSession();
  redirect(session ? homePath(session) : "/entrar");
}
