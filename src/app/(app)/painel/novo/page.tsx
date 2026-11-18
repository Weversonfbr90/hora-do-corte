import type { Metadata } from "next";
import Link from "next/link";
import { BookingFlow } from "@/components/app/booking-flow";
import { PageHeader } from "@/components/app/page-header";
import { Icon } from "@/components/ui";
import { zonedNow } from "@/lib/time";
import { getSettings, listBarbers, listServices } from "@/server/data";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Agendar para quem ligou · Hora do corte" };

/** US-18 — O dono agenda para um cliente que ligou. */
export default async function NovoAgendamentoPage() {
  await requireSession(["dono"]);
  const [services, barbers, settings] = await Promise.all([
    listServices({ activeOnly: true }),
    listBarbers({ activeOnly: true }),
    getSettings(),
  ]);
  return (
    <>
      <Link href="/painel" className="mb-2 inline-flex min-h-touch items-center gap-2 rounded-md text-label text-accent-strong hover:underline focus-visible:focus-ring">
        <Icon name="voltar" /> Painel
      </Link>
      <PageHeader title="Agendar para quem ligou" description="Mesmas regras do app: só horários livres, sem conflito." />
      <BookingFlow
        mode="telefone"
        services={services}
        barbers={barbers.map(({ id, name, schedule, daysOff }) => ({ id, name, schedule, daysOff }))}
        today={zonedNow().date}
        address={settings.address}
      />
    </>
  );
}
