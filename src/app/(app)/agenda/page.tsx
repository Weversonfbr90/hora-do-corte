import type { Metadata } from "next";
import { Suspense } from "react";
import { DayAgenda } from "@/components/app/day-agenda";
import { DayNav } from "@/components/app/day-nav";
import { PageHeader } from "@/components/app/page-header";
import { firstName } from "@/lib/format";
import { listBarberDay } from "@/server/data";
import { dayFromParams, withStarted } from "@/server/pages";
import { requireBarber } from "@/server/session";

export const metadata: Metadata = { title: "Agenda · Hora do corte" };

/** US-14/US-15 — Agenda do barbeiro: só a própria. */
export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const session = await requireBarber();
  const { date, today } = dayFromParams((await searchParams).dia);
  const items = await listBarberDay(session.uid, date);
  const active = items.filter((a) => a.status !== "cancelado").length;

  return (
    <>
      <PageHeader title="Minha agenda" description={`${firstName(session.name)}, ${active === 0 ? "nenhum atendimento" : active === 1 ? "1 atendimento" : `${active} atendimentos`} neste dia.`} />
      <div className="flex max-w-2xl flex-col gap-5">
        <Suspense>
          <DayNav date={date} today={today} />
        </Suspense>
        <DayAgenda key={date} items={withStarted(items)} />
      </div>
    </>
  );
}
