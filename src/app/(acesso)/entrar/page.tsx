import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession, homePath } from "@/server/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Hora do corte" };

export default async function EntrarPage() {
  const session = await getSession();
  if (session) redirect(homePath(session));
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
