import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DayAgenda } from "@/components/app/day-agenda";
import { DayNav } from "@/components/app/day-nav";
import { PageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/ui";
import { listBarbers, listDay } from "@/server/data";
import { dayFromParams, withStarted } from "@/server/pages";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Painel · Hora do corte" };

/** US-16/17/19 — Painel do dono: agenda de todos, filtros e totais do dia. */
export default async function PainelPage({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  await requireSession(["dono"]);
  const { date, today } = dayFromParams((await searchParams).dia);
  const [items, barbers] = await Promise.all([listDay(date), listBarbers({ activeOnly: false })]);

  const count = (s: string) => items.filter((a) => a.status === s).length;
  const totals = [
    { label: "Atendimentos", value: items.length - count("cancelado"), hint: "marcados no dia" },
    { label: "Concluídos", value: count("concluido"), hint: "já atendidos" },
    { label: "Faltas", value: count("falta"), hint: "não vieram" },
    { label: "Cancelados", value: count("cancelado"), hint: "liberados" },
  ];
  // Barbeiros que aparecem no filtro: ativos + quem tem horário neste dia.
  const filterBarbers = barbers.filter((b) => b.active || items.some((a) => a.barberId === b.id)).map((b) => ({ id: b.id, name: b.name }));

  return (
    <>
      <PageHeader
        title="Painel do dono"
        description="A agenda de todos os barbeiros."
        action={
          <Link
            href={date === today ? "/painel/novo" : `/painel/novo?dia=${date}`}
            className="inline-flex min-h-touch items-center justify-center gap-2 rounded-lg bg-primary px-5 font-semibold text-on-primary shadow-sm hover:bg-primary-hover focus-visible:focus-ring"
          >
            <Icon name="adicionar" /> Agendar para quem ligou
          </Link>
        }
      />
      <div className="flex flex-col gap-5">
        <Suspense>
          <DayNav date={date} today={today} />
        </Suspense>
        <section aria-label="Totais do dia">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {totals.map((t) => (
              <li key={t.label} className="rounded-lg border border-border bg-surface p-4">
                <p className="text-helper text-fg-muted">{t.label}</p>
                <p className="text-display tabular-nums">{t.value}</p>
                <p className="text-helper text-fg-muted">{t.hint}</p>
              </li>
            ))}
          </ul>
        </section>
        <div className="max-w-3xl">
          <DayAgenda key={date} items={withStarted(items)} ownerView barbers={filterBarbers} />
        </div>
      </div>
    </>
  );
}
