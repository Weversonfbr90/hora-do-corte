import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/app/booking-flow";
import { EmptyState, PageHeader } from "@/components/app/page-header";
import { canClientChange, zonedNow } from "@/lib/time";
import { getAppointment, getSettings, listBarbers, refs, toService } from "@/server/data";
import { requireSession } from "@/server/session";

export const metadata: Metadata = { title: "Remarcar · Hora do corte" };

export default async function RemarcarPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;
  const appt = await getAppointment(id);
  // Só o próprio cliente remarca por aqui.
  if (!appt || appt.clientId !== session.uid) notFound();

  const back = (
    <Link href="/meus-agendamentos" className="inline-flex min-h-touch items-center rounded-lg bg-primary px-5 font-semibold text-on-primary focus-visible:focus-ring">
      Voltar
    </Link>
  );
  if (appt.status !== "agendado" || !canClientChange(new Date(appt.startAt))) {
    return (
      <>
        <PageHeader title="Remarcar" />
        <EmptyState title="Não dá para remarcar este horário" action={back}>
          Só é possível remarcar até 2 horas antes. Fale com a barbearia.
        </EmptyState>
      </>
    );
  }

  const [serviceSnap, barbers, settings] = await Promise.all([refs.service(appt.serviceId).get(), listBarbers({ activeOnly: true }), getSettings()]);
  if (!serviceSnap.exists) {
    return (
      <>
        <PageHeader title="Remarcar" />
        <EmptyState title="Este serviço não é mais oferecido" action={back}>
          Cancele e faça um novo agendamento.
        </EmptyState>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Remarcar horário" description="Escolha o novo barbeiro, dia e horário." />
      <BookingFlow
        mode="remarcar"
        current={appt}
        services={[toService(serviceSnap)]}
        barbers={barbers.map(({ id: bid, name, schedule, daysOff }) => ({ id: bid, name, schedule, daysOff }))}
        today={zonedNow().date}
        address={settings.address}
      />
    </>
  );
}
