import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession, homePath } from "@/server/session";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Criar conta · Hora do corte" };

export default async function CriarContaPage() {
  const session = await getSession();
  if (session) redirect(homePath(session));
  return <SignUpForm />;
}
