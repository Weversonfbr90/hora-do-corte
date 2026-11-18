import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui";
import { zonedNow } from "@/lib/time";
import { getBarber, refs } from "@/server/data";
import { requireSession } from "@/server/session";
import { BarberEditor } from "./barber-editor";

export const metadata: Metadata = { title: "Barbeiro · Hora do corte" };

export default async function BarbeiroPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession(["dono"]);
  const { id } = await params;
  const [barber, userSnap] = await Promise.all([getBarber(id), refs.user(id).get()]);
  if (!barber || !userSnap.exists) notFound();
  const user = userSnap.data()!;
  const today = zonedNow().date;

  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <Link href="/gestao/equipe" className="inline-flex min-h-touch w-fit items-center gap-2 rounded-md text-label text-accent-strong hover:underline focus-visible:focus-ring">
        <Icon name="voltar" /> Equipe
      </Link>
      <BarberEditor
        barber={{ ...barber, daysOff: barber.daysOff.filter((d) => d >= today).sort() }}
        email={user.email}
        suspended={user.status === "suspenso"}
        isSelf={id === session.uid}
        today={today}
      />
    </div>
  );
}
